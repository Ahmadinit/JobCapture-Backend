const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFilter } = require('../src/controllers/publicJobsController');

test('buildFilter generates clean default query', () => {
  const f = buildFilter({});
  assert.deepEqual(f, {
    $and: [
      { deletedAt: null },
      { status: 'open' },
    ],
  });
});

test('buildFilter handles countries and region filtering', () => {
  const f = buildFilter({
    countries: 'United Arab Emirates,Pakistan',
    region: 'MENA',
  });

  const clauses = f.$and;
  const regionClause = clauses.find(c => c.region === 'MENA');
  assert.ok(regionClause, 'region filter present');

  const countryClause = clauses.find(c => c.$or && c.$or[0]?.country?.$in);
  assert.ok(countryClause, 'country filter present');
  assert.deepEqual(countryClause.$or[0].country.$in, ['United Arab Emirates', 'Pakistan']);
});

test('buildFilter handles remoteScope and unspecified countries', () => {
  const f = buildFilter({
    countries: 'unspecified',
    remoteScope: 'Pakistan only,Worldwide',
  });

  const clauses = f.$and;
  const scopeClause = clauses.find(c => c.remoteScope?.$in);
  assert.ok(scopeClause, 'remoteScope filter present');
  assert.deepEqual(scopeClause.remoteScope.$in, ['Pakistan only', 'Worldwide']);

  const unspecCountry = clauses.find(c => c.$or && c.$or.some(o => o.country === null));
  assert.ok(unspecCountry, 'unspecified country filter present');
});
