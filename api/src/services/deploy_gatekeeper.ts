import { alphaCopilot } from './alphaCopilot';

export async function deployGate() {
  const results = await alphaCopilot.fullKpiTuneCycle({});
  const rustResult = await alphaCopilot.orchestrateSpecialists('RustCompile', {});
  if (rustResult.status.active && results.every(r => r.tuned)) {
    return { approved: true };
  }
  return { approved: false, block: 'RustSpecialist' };
}

