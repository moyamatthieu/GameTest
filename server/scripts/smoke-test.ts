import http from 'node:http';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function checkHealth() {
  return new Promise<void>((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const body = JSON.parse(data);
          if (body.status === 'ok') {
            console.log('✅ Health check passed');
            resolve();
          } else {
            reject(new Error(`Health check failed: ${data}`));
          }
        } else {
          reject(new Error(`Health check failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
  });
}

async function run() {
  console.log(`🔍 Running smoke test on http://${HOST}:${PORT}...`);
  try {
    await checkHealth();
    console.log('🚀 Smoke test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Smoke test failed:');
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

run();
