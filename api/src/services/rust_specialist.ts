import { Specialist } from './specialists';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export class RustSpecialist implements Specialist {
  name = 'RustSpecialist';
  category = 'RustCompile';

  async tuneKpis(kpiData: any) {
    try {
      // Check Rust compile status
      const { stdout } = await execAsync('cd solver && cargo check');

      // Check for gate triggers based on compilation status
      const gateTrigger = await this.checkGateTriggers({ compileSuccess: stdout.includes('Finished') });
      if (gateTrigger.shouldTriggerGate && gateTrigger.gateId) {
        await this.triggerGateApproval(gateTrigger);
      }

      return {
        tuned: true,
        rust_ok: stdout.includes('Finished'),
        gateTrigger
      };
    } catch (err) {
      const error = err as Error;

      // Trigger CODE_QUALITY gate on compilation failure
      const gateTrigger = await this.checkGateTriggers({ compileError: error.message });
      if (gateTrigger.shouldTriggerGate && gateTrigger.gateId) {
        await this.triggerGateApproval(gateTrigger);
      }

      return {
        tuned: false,
        error: error.message,
        file: 'solver/src/reinforcement_meta_learner.rs',
        gateTrigger
      };
    }
  }

  async status() {
    return { status: 'ready', specialist: this.name };
  }

  async checkGateTriggers(kpiData: any): Promise<import('./specialists').GateTriggerResult> {
    // Trigger CODE_QUALITY gate on compilation failures
    if (kpiData.compileError) {
      return {
        shouldTriggerGate: true,
        gateId: 'CODE_QUALITY',
        triggerReason: `Rust compilation failed: ${kpiData.compileError}`,
        riskLevel: 'CRITICAL',
        recommendedActions: [
          'Fix compilation errors',
          'Code review required',
          'Deployment blocked until resolved'
        ]
      };
    }

    // All good - no gate trigger needed
    return { shouldTriggerGate: false };
  }

  private async triggerGateApproval(trigger: import('./specialists').GateTriggerResult) {
    try {
      const { gateKeeper } = await import('./gateKeeper');
      const gateResult = await gateKeeper.requestGateApproval(trigger.gateId!, {
        triggeredBy: this.name,
        triggerReason: trigger.triggerReason,
        riskLevel: trigger.riskLevel,
        recommendedActions: trigger.recommendedActions,
        specialistData: {
          category: this.category,
          timestamp: Date.now()
        }
      });

      const { logAnomaly } = await import('./specialists');
      if (gateResult.approved) {
        logAnomaly('GATE_TRIGGER', `✅ ${this.name} auto-approved ${trigger.gateId} gate`);
      } else {
        logAnomaly('GATE_TRIGGER', `⏳ ${this.name} requested ${trigger.gateId} gate approval - pending human review`);
      }
    } catch (error) {
      const { logAnomaly } = await import('./specialists');
      logAnomaly('GATE_TRIGGER', `❌ ${this.name} failed to trigger ${trigger.gateId} gate: ${error}`);
    }
  }
}

