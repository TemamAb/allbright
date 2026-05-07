import { logger } from "./logger";
import { sharedEngineState } from "./engineState";
import { fetchCurrentBlock } from "./blockTracker";
import { db, streamEventsTable } from "@workspace/db";
import * as crypto from "crypto";

interface WithdrawalRequest {
  id: string;
  amountEth: number;
  chainId: number;
  toAddress: string;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';
  timestamp: number;
  approvedBy?: string;
  approvalTimestamp?: number;
  txHash?: string;
  reason?: string;
}

/**
 * BSS-F: Institutional Withdrawal Gatekeeper
 * Enforces policies for secure and auditable multi-chain fund withdrawals.
 */
export class WithdrawalGatekeeperService {

  private genId(prefix: string): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  }

  /**
   * Evaluates a withdrawal request against defined institutional policies.
   */
  async evaluateRequest(request: Omit<WithdrawalRequest, 'id' | 'status' | 'timestamp'>): Promise<{ approved: boolean; reason: string; }> {
    const policy = sharedEngineState.withdrawalPolicy;
    const currentChainBalance = sharedEngineState.multiChainBalances[request.chainId]?.eth || 0;
    const currentDailyWithdrawals = sharedEngineState.pendingWithdrawals
      .filter(w => w.status === 'EXECUTED' && (Date.now() - w.timestamp) < (24 * 60 * 60 * 1000))
      .reduce((sum, w) => sum + w.amountEth, 0);

    // Policy 1: Daily Limit Check
    if (currentDailyWithdrawals + request.amountEth > policy.dailyLimitEth) {
      return { approved: false, reason: `Daily withdrawal limit of ${policy.dailyLimitEth} ETH exceeded.` };
    }

    // Policy 2: Minimum Balance Threshold
    if (currentChainBalance < request.amountEth) {
      return { approved: false, reason: `Insufficient balance (${currentChainBalance} ETH) on chain ${request.chainId}.` };
    }

    // Policy 3: Cooldown Period (simplified - check if any recent withdrawal)
    const lastWithdrawal = sharedEngineState.pendingWithdrawals
      .filter(w => w.status === 'EXECUTED')
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    if (lastWithdrawal && (Date.now() - lastWithdrawal.timestamp) < (policy.cooldownHours * 60 * 60 * 1000)) {
      return { approved: false, reason: `Withdrawal cooldown period of ${policy.cooldownHours} hours active.` };
    }

    // Policy 4: Role-based Approval (simplified - assumes requestor has the role)
    // In a real system, this would involve a multi-sig or separate approval flow
    const requestorRole = sharedEngineState.currentUserRole; // Assuming requestor is current user
    if (policy.minApprovalRole === 'ADMIN' && requestorRole !== 'ADMIN') {
      return { approved: false, reason: `Admin approval required for this withdrawal.` };
    }

    return { approved: true, reason: "All policies passed." };
  }

  /**
   * Logs a withdrawal event to the audit trail.
   */
  async logWithdrawalEvent(request: WithdrawalRequest) {
    await db.insert(streamEventsTable).values({
      id: this.genId("evt"),
      type: "WITHDRAWAL_AUDIT",
      message: `Withdrawal ${request.status}: ${request.amountEth} ETH to ${request.toAddress} on chain ${request.chainId}. Reason: ${request.reason || 'N/A'}`,
      blockNumber: (await fetchCurrentBlock()) || null,
      protocol: "VAULT",
    });
  }
}

export const withdrawalGatekeeper = new WithdrawalGatekeeperService();