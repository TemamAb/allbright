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

export async function analyzeReadiness(): Promise<ReadinessReport> {
  const checks: ReadinessCheck[] = [];
  let score = 100;

  // Core tools
  const nodeCheck = await checkCommand('node --version');
  checks.push(nodeCheck);
  const pnpmCheck = await checkCommand('pnpm --version');
  checks.push(pnpmCheck);
  const cargoCheck = await checkCommand('cargo --version');
  checks.push(cargoCheck);
  const dockerCheck = await checkCommand('docker --version');
  checks.push(dockerCheck);

  // Files
  const cargoToml = existsSync('Cargo.toml') ? { status: 'pass' as const, score: 20 } : { status: 'fail' as const, score: 0 };
  checks.push({ name: 'Cargo.toml', required: true, status: cargoToml.status, message: cargoToml.status === 'pass' ? 'Found' : 'Missing', score: cargoToml.score });
  score += cargoToml.score;

  const dockerfile = existsSync('Dockerfile') ? { status: 'pass' as const, score: 15 } : { status: 'warn' as const, score: 5 };
  checks.push({ name: 'Dockerfile', required: true, status: dockerfile.status, message: dockerfile.status === 'pass' ? 'Found' : 'Missing', score: dockerfile.score });
  score += dockerfile.score;

  const workspace = existsSync('pnpm-workspace.yaml') ? { status: 'pass' as const, score: 15 } : { status: 'warn' as const, score: 5 };
  checks.push({ name: 'pnpm-workspace.yaml', required: true, status: workspace.status, message: workspace.status === 'pass' ? 'Found' : 'Missing', score: workspace.score });
  score += workspace.score;

  // .env status
  const envStatus = existsSync('.env') ? { status: 'pass' as const, score: 25 } : { status: 'warn' as const, score: 0 };
  checks.push({ name: '.env', required: false, status: envStatus.status, message: envStatus.status === 'pass' ? 'Ready' : 'Upload required before live', score: envStatus.score });
  score += envStatus.score;

  const overallScore = Math.max(0, score);

  const recommendations = [
    ...checks.filter(c => c.status === 'fail').map(c => `Install ${c.name}`),
    ...checks.filter(c => c.status === 'warn').map(c => `Fix ${c.name}`),
  ];

  return {
    overallScore,
    checks,
    envReady: envStatus.status === 'pass',
    recommendations,
  };
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

