// MegaBachatMart — Environment Variable Bootstrapper
// Loads configuration from .env / .env.production without embedding sensitive credentials in source control.

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
}

// Auto-run bootstrap on module load
ensureEnvironmentBootstrapped();
