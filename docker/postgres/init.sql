-- MegaBachatMart — Postgres 15 Initialization Script
-- Enables required cryptographic & trigram indexing extensions

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create application role with restricted grants if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'megabachat_app') THEN
    CREATE ROLE megabachat_app WITH LOGIN PASSWORD 'megabachat_secure_pass_2026';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE megabachatmart TO megabachat_app;
GRANT ALL ON SCHEMA public TO megabachat_app;
