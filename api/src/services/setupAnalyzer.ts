import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { logger } from './logger';
import { AlphaCopilot } from './alphaCopilot';
import * as path from 'path';

const execAsync = promisify(exec);
const alphaCopilot = new AlphaCopilot();

export interface ReadinessCheck {
  name: string;
  required: boolean;
  status: 'pass' | 'warn' | 'fail';
  version?: string;
  message: string;
  score: number; // 0-100
}

export interface ReadinessReport {
  overallScore: number;
  checks: ReadinessCheck[];
  envReady: boolean;
  recommendations: string[];
}

/**
 * SINGLE ENTRYPOINT - ALL readiness calls redirect here
 * Command: `node run-readiness-report.js`
 * Report: DEPLOYMENT-READINESS-REPORT.md (appends columns)
 * NO CONFUSION - deprecated all others
 */
export async function analyzeReadiness(): Promise<any> {
  console.warn('[UNIFIED] SINGLE WORKFLOW: node run-readiness-report.js → DEPLOYMENT-READINESS-REPORT.md');
  const { generateDeploymentReadinessReport } = await import('./deploy_gatekeeper.js');
  const report = await generateDeploymentReadinessReport();
  console.log('Status:', report.overallStatus, 'Score:', report.deploymentScore);
  console.log('36-KPI Domains:', report.kpiBreakdown.map(d => `${d.domain}:${d.status}`).join(', '));
  return report;
}

async function checkCommand(cmd: string): Promise<ReadinessCheck> {
  try {
    const { stdout } = await execAsync(cmd);
    const version = stdout.trim().split(' ')[2];
    return {
      name: cmd.split(' ')[0],
      required: true,
      status: 'pass' as const,
      version,
      message: `v${version}`,
      score: 10,
    };
  } catch {
    return {
      name: cmd.split(' ')[0],
      required: true,
      status: 'fail' as const,
      message: 'Not found',
      score: 0,
    };
  }
}

// Install helpers (safe exec via alphaCopilot)
export async function installDeps() {
  await alphaCopilot.executeMissionCommand('cd ui && pnpm install');
  await alphaCopilot.executeMissionCommand('cd solver && cargo build --release');
  logger.info('Onboarding deps installed');
}

export async function startLocal() {
  await alphaCopilot.executeMissionCommand('docker-compose up -d');
  logger.info('Local stack started');
}

