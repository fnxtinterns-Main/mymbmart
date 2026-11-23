// ecosystem.config.cjs
// MegaBachatMart Production PM2 Process Supervision Configuration
module.exports = {
  apps: [
    {
      name: 'mbm-web',
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'mbm-outbox-worker',
      script: 'scripts/run-outbox-worker.mjs',
      interpreter: 'node',
      node_args: '--experimental-strip-types --loader ./scripts/loader.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      restart_delay: 2000,
      max_restarts: 50,
      max_memory_restart: '500M',
      time: true,
      env: {
        NODE_ENV: 'production',
        OUTBOX_POLL_INTERVAL_MS: 3000,
        OUTBOX_BATCH_SIZE: 25,
      },
      error_file: './logs/outbox-worker-error.log',
      out_file: './logs/outbox-worker-out.log',
      merge_logs: true,
    },
  ],
};
