import { logger } from "./logger";
import { sharedEngineState } from "./engineState";
import { db, streamEventsTable } from "@workspace/db";
import * as crypto from "crypto";

interface MultiSigApproval {
  id: string;
  type: 'WITHDRAWAL' | 'CONFIG_CHANGE' | 'GATE_OVERRIDE';
  requestId: string;
  requestor: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  requiredSigners: string[];
  signatures: string[];
  timestamp: number;
  executedAt?: number;
}

/**
 * BSS-F: Multi-Sig Approval Service
 * Implements institutional-grade multi-party approval for sensitive operations.
 */
export class MultiSigApprovalService {
  private approvals: Map<string, MultiSigApproval> = new Map();
  private readonly REQUIRED_SIGNATURES = 2;

  private genId(prefix: string): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  }

  /**
   * Creates a new multi-sig approval request.
   */
  async createApproval(
    type: MultiSigApproval['type'],
    requestId: string,
    requestor: string,
    description: string
  ): Promise<{ approvalId: string; requiredSigners: string[] }> {
    // Get required signers (admin wallets from engine state)
    const requiredSigners = sharedEngineState.wallets
      .filter(w => w.role === 'ADMIN')
      .map(w => w.address)
      .slice(0, this.REQUIRED_SIGNATURES);

    // Fallback to default if no admins configured
    if (requiredSigners.length === 0) {
      requiredSigners.push('0xDEFAULT_ADMIN_1', '0xDEFAULT_ADMIN_2');
    }

    const approval: MultiSigApproval = {
      id: this.genId("msig"),
      type,
      requestId,
      requestor,
      description,
      status: 'PENDING',
      requiredSigners,
      signatures: [],
      timestamp: Date.now(),
    };

    this.approvals.set(approval.id, approval);

    logger.info({
      approvalId: approval.id,
      type,
      requiredSigners,
    }, "[MULTISIG] Approval request created");

    return {
      approvalId: approval.id,
      requiredSigners,
    };
  }

  /**
   * Submits a signature for a pending approval.
   */
  async submitSignature(
    approvalId: string,
    signer: string,
    signature: string
  ): Promise<{ success: boolean; status: string; reason?: string }> {
    const approval = this.approvals.get(approvalId);

    if (!approval) {
      return { success: false, status: 'NOT_FOUND', reason: 'Approval not found' };
    }

    if (approval.status !== 'PENDING') {
      return { success: false, status: approval.status, reason: 'Approval already processed' };
    }

    // Verify signer is in required signers list
    if (!approval.requiredSigners.includes(signer)) {
      return { success: false, status: 'INVALID_SIGNER', reason: 'Signer not authorized' };
    }

    // Check for duplicate signature
    if (approval.signatures.some(s => s.startsWith(signer))) {
      return { success: false, status: 'DUPLICATE', reason: 'Signature already submitted' };
    }

    // Add signature (format: "signer:signature")
    approval.signatures.push(`${signer}:${signature}`);

    logger.info({ approvalId, signer, signatureCount: approval.signatures.length }, "[MULTISIG] Signature submitted");

    // Check if threshold met
    if (approval.signatures.length >= this.REQUIRED_SIGNATURES) {
      approval.status = 'APPROVED';
      approval.executedAt = Date.now();

      // Log to audit trail
      await this.logApprovalEvent(approval, 'APPROVED');

      logger.info({ approvalId }, "[MULTISIG] Approval threshold met");
    }

    return { success: true, status: approval.status };
  }

  /**
   * Gets the current status of an approval request.
   */
  async getApprovalStatus(approvalId: string): Promise<{
    status: string;
    signaturesCount: number;
    requiredCount: number;
  } | null> {
    const approval = this.approvals.get(approvalId);

    if (!approval) {
      return null;
    }

    return {
      status: approval.status,
      signaturesCount: approval.signatures.length,
      requiredCount: this.REQUIRED_SIGNATURES,
    };
  }

  /**
   * Checks if an approval is fully signed.
   */
  isApproved(approvalId: string): boolean {
    const approval = this.approvals.get(approvalId);
    return approval?.status === 'APPROVED';
  }

  /**
   * Processes withdrawal request approval.
   * Returns whether multi-sig approval is required.
   */
  async requiresApproval(
    amountEth: number,
    chainId: number
  ): Promise<{ required: boolean; approvalId?: string }> {
    const policy = sharedEngineState.withdrawalPolicy;

    // Threshold check
    if (amountEth >= policy.multiSigThresholdEth) {
      const result = await this.createApproval(
        'WITHDRAWAL',
        `wd_${Date.now()}`,
        'SYSTEM',
        `Withdrawal of ${amountEth} ETH on chain ${chainId} requires multi-sig approval`
      );

      return { required: true, approvalId: result.approvalId };
    }

    return { required: false };
  }

  /**
   * Logs approval event to audit trail.
   */
  private async logApprovalEvent(approval: MultiSigApproval, eventStatus: string) {
    try {
      await db.insert(streamEventsTable).values({
        id: this.genId("evt"),
        type: "MULTISIG_AUDIT",
        message: `Multi-sig ${approval.type}: ${eventStatus} - ${approval.description}. Signatures: ${approval.signatures.length}/${this.REQUIRED_SIGNATURES}`,
        blockNumber: null,
        protocol: "VAULT",
      });
    } catch (err) {
      logger.error({ err, approvalId: approval.id }, "[MULTISIG] Failed to log event");
    }
  }
}

export const multiSigApprovalService = new MultiSigApprovalService();
