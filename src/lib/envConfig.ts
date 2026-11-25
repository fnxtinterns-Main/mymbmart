// MegaBachatMart — Central Environment Variable & Production Multi-Worker Bootstrapper
// Guarantees all Passenger/CloudLinux worker processes have access to authoritative
// PostgreSQL, Upstash Redis, and Security credentials even when host environments omit injection.

let isInitialized = false;

export function ensureEnvironmentBootstrapped() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const dotenv = require('dotenv');
    dotenv.config();
    const path = require('path');
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
  } catch {}

  // Safe fallbacks matching authoritative deployment configuration
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://mbm_admin:MegaBachatMart2026@Secure@13.205.112.255:5432/mymbmart?schema=public';
  }

  if (!process.env.UPSTASH_REDIS_REST_URL) {
    process.env.UPSTASH_REDIS_REST_URL = 'https://holy-panther-217313.upstash.io';
  }

  if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
    process.env.UPSTASH_REDIS_REST_TOKEN = 'gQAAAAAAA1DhAAIgcDFlNzQxMDY5YjRkNTA0MTA2YmQyNTUxMmJiYjViZWVkZg';
  }

  if (!process.env.ADMIN_EMAIL) {
    process.env.ADMIN_EMAIL = 'fnxt.admin@gmail.com';
  }

  if (!process.env.ADMIN_PIN) {
    process.env.ADMIN_PIN = 'MMBM@Admin2026';
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'megabachatmart-smartchain-secret-key-2026';
  }

  if (!process.env.SMTP_HOST) {
    process.env.SMTP_HOST = 'smtp.hostinger.com';
  }

  if (!process.env.SMTP_PORT) {
    process.env.SMTP_PORT = '465';
  }

  if (!process.env.SMTP_USER) {
    process.env.SMTP_USER = 'support@mymbmart.com';
  }

  if (!process.env.SMTP_PASS) {
    process.env.SMTP_PASS = 'Mymbmart@99';
  }

  if (!process.env.SMTP_FROM) {
    process.env.SMTP_FROM = 'MegaBachatMart Support <support@mymbmart.com>';
  }
}

// Auto-run bootstrap on module load
ensureEnvironmentBootstrapped();
