import { logger } from './logger';
import { validateDotenv } from './dotenvValidator';
import { sharedEngineState } from './engineState';
import * as fs from 'fs';
import * as path from 'path';

export class OnboardingService {
  private dataDir: string;

  constructor() {
    // Use the AppData directory provided by Electron
    this.dataDir = process.env.allbright_DATA_DIR || path.join(process.cwd(), '.data');
    
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * BSS-52: Load and decrypt persisted configuration
   */
  async loadPersistedConfig() {
    const configPath = path.join(this.dataDir, 'secure_config.json');
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf8');
        const data = JSON.parse(raw);
        
        // Recommendation 1: Hardware-level decryption via Electron bridge (safeStorage)
        const privateKey = await this.decryptWithHardwareBridge(data.encryptedPrivateKey);
        
        return { ...data, privateKey };
      } catch (err) {
        logger.error({ err }, '[ONBOARDING] Failed to load secure config');
      }
    }
    return null;
  }

  /**
   * Requests the Electron Main process to decrypt a credential using safeStorage.
   * Since safeStorage is only available in the Electron process, the forked API
   * process must request decryption via IPC.
   */
  async decryptWithHardwareBridge(encryptedData: string): Promise<string | null> {
    if (!process.send) return null;
    
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).substring(7);
      const handler = (msg: any) => {
        if (msg.type === 'DECRYPT_RESPONSE' && msg.requestId === requestId) {
          process.off('message', handler);
          resolve(msg.payload);
        }
      };
      process.on('message', handler);
      process.send!({ type: 'DECRYPT_REQUEST', requestId, payload: encryptedData });
      
      // Timeout after 5s
      setTimeout(() => {
        process.off('message', handler);
        resolve(null);
      }, 5000);
    });
  }

  /**
   * Handles the "First Run" setup wizard logic
   */
  async completeOnboarding(config: {
    rpcEndpoint: string;
    pimlicoKey: string;
    privateKey: string;
  }) {
    logger.info('[ONBOARDING] Initializing setup wizard validation');

    // 1. Validate formats (skip private key validation as it's already an encrypted blob from hardware bridge)
    const validation = validateDotenv(`
      RPC_URL_BASE=${config.rpcEndpoint}
      PRIVATE_KEY=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
      PIMLICO_API_KEY=${config.pimlicoKey}
    `);

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.warnings.join(', ')}`);
    }

    // 3. Persist local config file
    const configPath = path.join(this.dataDir, 'secure_config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      rpcEndpoint: config.rpcEndpoint,
      pimlicoKey: config.pimlicoKey,
      encryptedPrivateKey: config.privateKey, // Already hardware-encrypted via bridge
      setupAt: new Date().toISOString()
    }, null, 2));

    logger.info('[ONBOARDING] Secure configuration persisted to AppData');
    return { success: true };
  }
}

export const onboardingService = new OnboardingService();
