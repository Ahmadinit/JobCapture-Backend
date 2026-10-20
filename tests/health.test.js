const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

test('GET /api/health returns health status and database readiness', async (t) => {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.ok(res.status === 200 || res.status === 503, `Unexpected status code: ${res.status}`);

    const data = await res.json();
    assert.ok(typeof data.status === 'string');
    assert.ok(typeof data.database === 'object');
    assert.ok(typeof data.database.status === 'string');
    assert.ok(typeof data.uptime === 'number');
    assert.ok(typeof data.timestamp === 'string');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
