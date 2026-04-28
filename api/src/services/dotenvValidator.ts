export interface EnvValidation {
  valid: boolean;
  missing: string[];
  keys: string[];
  warnings: string[];
  parsedVars: Record<string, string>;
  rawContent: string;
}

export function validateDotenv(content: string): EnvValidation {
  // Parse Render-style KEY=value format (no quotes needed)
  const envVars: Record<string, string> = {};
  const lines = content.split('\n');
  const keys: string[] = [];
  const required = [
    'RPC_URL_BASE',
    'PRIVATE_KEY',
    'OPENAI_API_KEY', // optional for copilot
    'PIMLICO_API_KEY', // for gasless
  ];
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      const cleanKey = key.trim();
      if (cleanKey) {
        envVars[cleanKey] = value;
        keys.push(cleanKey);
      }
    }
  }

  for (const req of required) {
    if (!keys.includes(req)) {
      missing.push(req);
    }
  }

  // Render-style validation
  if (keys.includes('PRIVATE_KEY') && envVars.PRIVATE_KEY && (!envVars.PRIVATE_KEY.startsWith('0x') || envVars.PRIVATE_KEY.length !== 66)) {
    warnings.push('PRIVATE_KEY must be 66 chars starting with 0x');
  }
  if (keys.includes('RPC_URL_BASE') && envVars.RPC_URL_BASE && !envVars.RPC_URL_BASE.startsWith('http')) {
    warnings.push('RPC_URL_BASE must start with http:// or https://');
  }

  return {
    valid: missing.length === 0 && warnings.length === 0,
    missing,
    keys,
    warnings,
    parsedVars: envVars,
    rawContent: content
  };
}

// Auto-configure system with parsed vars (simulate Render dashboard)
export function configureFromEnv(parsedVars: Record<string, string>) {
  const configPath = process.env.BRIGHTSKY_CONFIG_PATH || '.brightsky.config.json';
  const config = {
    rpc: parsedVars.RPC_URL_BASE,
    privateKey: parsedVars.PRIVATE_KEY,
    openaiKey: parsedVars.OPENAI_API_KEY,
    pimlicoKey: parsedVars.PIMLICO_API_KEY,
    configuredAt: new Date().toISOString()
  };

  // In production, save to secure store or Windows Credential Manager
  console.log('Auto-configured from .env:', config);
  return config;
}

