import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

function getDatabaseSync(): any {
  try {
    // 1. If native require is available (CommonJS bundle in dist/server.cjs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    if (typeof g.require === 'function') {
      return g.require('node:sqlite')?.DatabaseSync;
    }
  } catch {}

  try {
    // 2. ESM mode (tsx dev server) using createRequire safely with non-empty URL fallback
    const metaUrl = (typeof import.meta !== 'undefined' && import.meta && import.meta.url)
      ? import.meta.url
      : `file://${path.resolve(process.cwd(), 'package.json')}`;
    const customReq = createRequire(metaUrl);
    return customReq('node:sqlite')?.DatabaseSync;
  } catch (err) {
    console.warn('Unable to load node:sqlite via createRequire:', err);
  }

  return null;
}

export interface BankAccount {
  id: string;
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface PaymentConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  whatsappNumber: string;
  bankAccounts: BankAccount[];
  updatedAt?: string;
  isConfigured: boolean;
}

const DEFAULT_EMPTY_CONFIG: PaymentConfig = {
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  whatsappNumber: '',
  bankAccounts: [],
  updatedAt: new Date().toISOString(),
  isConfigured: false,
};

export interface AstraConfig {
  enabled: boolean;
  model: string;
  apiKey: string;
  maxTokens: number;
  monthlyUsageLimit: number;
  updatedAt?: string;
}

const DEFAULT_ASTRA_CONFIG: AstraConfig = {
  enabled: true,
  model: 'gpt-6-astra',
  apiKey: process.env.OPENAI_API_KEY || '',
  maxTokens: 2000,
  monthlyUsageLimit: 1000,
  updatedAt: new Date().toISOString(),
};

class FounderServiceClass {
  private paymentConfig: PaymentConfig = { ...DEFAULT_EMPTY_CONFIG };
  private astraConfig: AstraConfig = { ...DEFAULT_ASTRA_CONFIG };
  private db: any = null;
  private dbPath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        console.warn('Failed to create data directory:', e);
      }
    }
    this.dbPath = path.join(dataDir, 'system_settings.db');
    this.initDatabase();
    this.loadConfig();
    this.loadAstraConfig();
  }

  private initDatabase() {
    try {
      const DatabaseSync = getDatabaseSync();
      if (DatabaseSync) {
        this.db = new DatabaseSync(this.dbPath);
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);
      } else {
        this.db = null;
      }
    } catch (e) {
      console.warn('node:sqlite initialization fallback to JSON storage:', e);
      this.db = null;
    }
  }

  public loadConfig(): PaymentConfig {
    try {
      if (this.db) {
        const stmt = this.db.prepare('SELECT value FROM system_settings WHERE key = ?');
        const row = stmt.get('payment_config');
        if (row && row.value) {
          const parsed = JSON.parse(row.value);
          this.paymentConfig = this.normalizeConfig(parsed);
          return this.paymentConfig;
        }
      } else {
        // Fallback JSON persistence
        const jsonPath = path.join(process.cwd(), 'data', 'system_settings.json');
        if (fs.existsSync(jsonPath)) {
          const raw = fs.readFileSync(jsonPath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.payment_config) {
            this.paymentConfig = this.normalizeConfig(parsed.payment_config);
            return this.paymentConfig;
          }
        }
      }
    } catch (err) {
      console.error('Error loading payment configuration from storage:', err);
    }
    return this.paymentConfig;
  }

  private normalizeConfig(raw: any): PaymentConfig {
    const bankName = (raw.bankName || '').trim();
    const accountNumber = (raw.accountNumber || '').trim();
    const accountHolder = (raw.accountHolder || raw.accountName || '').trim();
    const whatsappNumber = (raw.whatsappNumber || '').trim();

    let bankAccounts: BankAccount[] = [];
    if (Array.isArray(raw.bankAccounts) && raw.bankAccounts.length > 0) {
      bankAccounts = raw.bankAccounts.map((acc: any, idx: number) => ({
        id: String(acc.id || `acc-${idx + 1}`),
        bank: String(acc.bank || acc.bankName || ''),
        accountNumber: String(acc.accountNumber || ''),
        accountName: String(acc.accountName || acc.accountHolder || ''),
      })).filter(acc => acc.bank && acc.accountNumber);
    } else if (bankName && accountNumber) {
      bankAccounts = [{
        id: 'acc-primary',
        bank: bankName,
        accountNumber: accountNumber,
        accountName: accountHolder,
      }];
    }

    const isConfigured = Boolean((bankName && accountNumber) || bankAccounts.length > 0);

    return {
      bankName: bankName || (bankAccounts[0]?.bank || ''),
      accountNumber: accountNumber || (bankAccounts[0]?.accountNumber || ''),
      accountHolder: accountHolder || (bankAccounts[0]?.accountName || ''),
      whatsappNumber,
      bankAccounts,
      updatedAt: raw.updatedAt || new Date().toISOString(),
      isConfigured,
    };
  }

  public saveConfig(): boolean {
    try {
      const now = new Date().toISOString();
      this.paymentConfig.updatedAt = now;
      const jsonStr = JSON.stringify(this.paymentConfig);

      if (this.db) {
        const stmt = this.db.prepare(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `);
        stmt.run('payment_config', jsonStr, now);
      }

      // Also ensure fallback json sync for cross-engine durability
      const jsonPath = path.join(process.cwd(), 'data', 'system_settings.json');
      let data: any = {};
      if (fs.existsSync(jsonPath)) {
        try {
          data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        } catch {
          data = {};
        }
      }
      data.payment_config = this.paymentConfig;
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

      return true;
    } catch (err) {
      console.error('Error saving payment configuration to storage:', err);
      return false;
    }
  }

  public getPaymentConfig(): PaymentConfig {
    return this.paymentConfig;
  }

  public updatePaymentConfig(newConfig: Partial<PaymentConfig>): PaymentConfig {
    const merged = {
      ...this.paymentConfig,
      ...newConfig,
      updatedAt: new Date().toISOString(),
    };
    this.paymentConfig = this.normalizeConfig(merged);
    this.saveConfig();
    return this.paymentConfig;
  }

  public loadAstraConfig(): AstraConfig {
    try {
      if (this.db) {
        const stmt = this.db.prepare('SELECT value FROM system_settings WHERE key = ?');
        const row = stmt.get('astra_config');
        if (row && row.value) {
          const parsed = JSON.parse(row.value);
          this.astraConfig = {
            ...DEFAULT_ASTRA_CONFIG,
            ...parsed,
          };
          return this.astraConfig;
        }
      } else {
        const jsonPath = path.join(process.cwd(), 'data', 'system_settings.json');
        if (fs.existsSync(jsonPath)) {
          const raw = fs.readFileSync(jsonPath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.astra_config) {
            this.astraConfig = {
              ...DEFAULT_ASTRA_CONFIG,
              ...parsed.astra_config,
            };
            return this.astraConfig;
          }
        }
      }
    } catch (err) {
      console.error('Error loading Astra configuration from storage:', err);
    }
    return this.astraConfig;
  }

  public saveAstraConfig(): boolean {
    try {
      const now = new Date().toISOString();
      this.astraConfig.updatedAt = now;
      const jsonStr = JSON.stringify(this.astraConfig);

      if (this.db) {
        const stmt = this.db.prepare(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `);
        stmt.run('astra_config', jsonStr, now);
      }

      const jsonPath = path.join(process.cwd(), 'data', 'system_settings.json');
      let data: any = {};
      if (fs.existsSync(jsonPath)) {
        try {
          data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        } catch {
          data = {};
        }
      }
      data.astra_config = this.astraConfig;
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

      return true;
    } catch (err) {
      console.error('Error saving Astra configuration to storage:', err);
      return false;
    }
  }

  public getAstraConfig(): AstraConfig {
    return this.astraConfig;
  }

  public getMaskedAstraConfig(): Omit<AstraConfig, 'apiKey'> & { apiKey: string; hasApiKey: boolean } {
    const rawKey = this.astraConfig.apiKey || '';
    let masked = 'sk-••••••••••••••••';
    if (rawKey.length > 8) {
      masked = `${rawKey.substring(0, 4)}••••••••••••${rawKey.substring(rawKey.length - 4)}`;
    } else if (rawKey.length > 0) {
      masked = 'sk-••••••••••••••••';
    } else {
      masked = '';
    }

    return {
      enabled: this.astraConfig.enabled,
      model: this.astraConfig.model || 'gpt-6-astra',
      apiKey: masked,
      hasApiKey: Boolean(rawKey && rawKey.trim().length > 0),
      maxTokens: this.astraConfig.maxTokens || 2000,
      monthlyUsageLimit: this.astraConfig.monthlyUsageLimit || 1000,
      updatedAt: this.astraConfig.updatedAt,
    };
  }

  public updateAstraConfig(newConfig: Partial<AstraConfig>): AstraConfig {
    // If client passes a masked key back, retain existing unmasked key
    let finalKey = this.astraConfig.apiKey;
    if (newConfig.apiKey && !newConfig.apiKey.includes('••••')) {
      finalKey = newConfig.apiKey.trim();
    }

    this.astraConfig = {
      ...this.astraConfig,
      ...newConfig,
      apiKey: finalKey,
      updatedAt: new Date().toISOString(),
    };
    this.saveAstraConfig();
    return this.astraConfig;
  }
}

export const FounderService = new FounderServiceClass();
