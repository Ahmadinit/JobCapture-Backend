const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePostAge } = require('../src/utils/postAge');

test('parsePostAge parses hours and fresh days correctly', () => {
  const ref = new Date('2026-10-18T12:00:00Z');
  
  const h2 = parsePostAge('2h', ref);
  assert.equal(h2.isStale, false);
  assert.equal(h2.postedAt.toISOString(), '2026-10-18T10:00:00.000Z');

  const d1 = parsePostAge('1d', ref);
  assert.equal(d1.isStale, false);
  assert.equal(d1.ageDays, 1);

  const d3 = parsePostAge('3d', ref);
  assert.equal(d3.isStale, false);
  assert.equal(d3.postedAt.toISOString(), '2026-10-15T12:00:00.000Z');
});

test('parsePostAge detects stale posts (> 3 days)', () => {
  const ref = new Date('2026-10-18T12:00:00Z');

  const d4 = parsePostAge('4d', ref);
  assert.equal(d4.isStale, true);
  assert.equal(d4.ageDays, 4);

  const w1 = parsePostAge('1w', ref);
  assert.equal(w1.isStale, true);
  assert.equal(w1.ageDays, 7);

  const w2 = parsePostAge('2w', ref);
  assert.equal(w2.isStale, true);
  assert.equal(w2.ageDays, 14);

  const mo2 = parsePostAge('2mo', ref);
  assert.equal(mo2.isStale, true);

  const d40 = parsePostAge('40d', ref);
  assert.equal(d40.isStale, true);

  const gt3 = parsePostAge('>3d', ref);
  assert.equal(gt3.isStale, true);
});

test('parsePostAge gracefully handles null or invalid strings', () => {
  const nullAge = parsePostAge(null);
  assert.equal(nullAge.isStale, false);
  assert.equal(nullAge.ageDays, null);
  assert.equal(nullAge.postedAt, null);

  const garbage = parsePostAge('just nowish');
  assert.equal(garbage.isStale, false);
  assert.equal(garbage.ageDays, null);
  assert.equal(garbage.postedAt, null);
});
