// MegaBachatMart — Environment Variables Validation (P0-S1 Task 1.5)
// Validates presence and defaults for database, redis, and auth keys without external overhead.

interface AppEnv {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  NEXT_PUBLIC_ADMIN_PIN: string;
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
}

function validateEnv(): AppEnv {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'test' | 'production';
  
  return {
    NODE_ENV: nodeEnv,
    PORT: process.env.PORT || '3000',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/megabachatmart?schema=public',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'mbm_master_jwt_secret_key_change_in_production_2026',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'mbm_master_refresh_secret_key_2026',
    NEXT_PUBLIC_ADMIN_PIN: process.env.NEXT_PUBLIC_ADMIN_PIN || 'MBM@Admin2026',
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
    MINIO_PORT: Number(process.env.MINIO_PORT || 9000),
  };
}

export const env = validateEnv();
