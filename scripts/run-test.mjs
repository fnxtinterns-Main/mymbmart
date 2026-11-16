import { spawn } from 'child_process';
import http from 'http';

const PORT = 3001;

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Server start timed out'));
        } else {
          setTimeout(check, 500);
        }
      });
    }
    check();
  });
}

async function main() {
  console.log('Starting Next.js test server on port ' + PORT + '...');
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npx.cmd' : 'npx';
  const server = spawn(cmd, ['next', 'start', '-p', String(PORT)], {
    stdio: 'inherit',
    shell: true,
  });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}/api/products`);
    console.log('Server is ready. Executing E2E test suite...\n');

    const testRun = spawn('node', ['scripts/e2e-api-test.mjs'], {
      stdio: 'inherit',
      env: { ...process.env, TEST_BASE_URL: `http://127.0.0.1:${PORT}` },
    });

    testRun.on('close', (code) => {
      server.kill();
      if (isWindows) {
        spawn('taskkill', ['/pid', String(server.pid), '/f', '/t'], { stdio: 'ignore' });
      }
      process.exit(code);
    });
  } catch (err) {
    console.error(err);
    server.kill();
    process.exit(1);
  }
}

main();
