/**
 * AES-256-GCM encryption utility for securing .env credentials
 * Free tier: uses aes-js (no paid dependencies)
 */
import * as aesjs from 'aes-js';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export class EnvEncryption {
  private key: Uint8Array;

  constructor(secretKey: string) {
    const hash = crypto.createHash('sha256').update(secretKey).digest();
    this.key = new Uint8Array(hash);
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const aesGcm = new aesjs.ModeOfOperation.gcm(this.key, iv);
    const textBytes = aesjs.utils.utf8.toBytes(plaintext);
    const encryptedBytes = aesGcm.encrypt(textBytes);
    const combined = new Uint8Array(iv.length + encryptedBytes.length);
    combined.set(iv);
    combined.set(encryptedBytes, iv.length);
    return Buffer.from(combined).toString('base64');
  }

  decrypt(encryptedBase64: string): string {
    const combined = Buffer.from(encryptedBase64, 'base64');
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const aesGcm = new aesjs.ModeOfOperation.gcm(
      this.key,
      new Uint8Array(iv)
    );
    const decryptedBytes = aesGcm.decrypt(new Uint8Array(encrypted));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }
}

export function encryptEnvVars(secretKey: string): Record<string, string> {
  const enc = new EnvEncryption(secretKey);
  const sensitiveKeys = [
    'DATABASE_URL',
    'PIMLICO_API_KEY',
    'PRIVATE_KEY',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY'
  ];
  const result: Record<string, string> = {};
  for (const key of sensitiveKeys) {
    const value = process.env[key];
    if (value) {
      result[`${key}_ENCRYPTED`] = enc.encrypt(value);
      delete process.env[key];
    }
  }
  return result;
}

export function decryptEnvVars(secretKey: string): void {
  const enc = new EnvEncryption(secretKey);
  for (const key in process.env) {
    if (key.endsWith('_ENCRYPTED')) {
      const originalKey = key.replace('_ENCRYPTED', '');
      try {
        process.env[originalKey] = enc.decrypt(process.env[key]!);
        delete process.env[key];
      } catch (e) {
        console.error(`Failed to decrypt ${key}:`, e);
      }
    }
  }
}
