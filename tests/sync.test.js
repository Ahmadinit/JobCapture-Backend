require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

test('Admin sync trigger and status endpoints enforce authentication and cooldown', async (t) => {
  const token = jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET || 'testsecret');

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Unauthenticated request rejected
    const unauthRes = await fetch(`${baseUrl}/api/admin/sync/status`);
    assert.equal(unauthRes.status, 401);

    // 2. Authenticated status returns valid contract
    const statusRes = await fetch(`${baseUrl}/api/admin/sync/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.ok('canTrigger' in statusData);
    assert.ok('cooldownRemainingSec' in statusData);

    // 3. Authenticated trigger works
    const triggerRes = await fetch(`${baseUrl}/api/admin/sync/trigger`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.ok(triggerRes.status === 200 || triggerRes.status === 429);
    const triggerData = await triggerRes.json();

    if (triggerRes.status === 200) {
      assert.ok(triggerData.status === 'dispatched' || triggerData.status === 'acknowledged');

      // 4. Immediate second trigger fails with 429 cooldown
      const secondTrigger = await fetch(`${baseUrl}/api/admin/sync/trigger`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(secondTrigger.status, 429);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
