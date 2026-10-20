const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeCountry,
  deriveRegion,
  normalizeCities,
  resolveLocation,
  REGIONS,
} = require('../src/taxonomy/locations');

test('normalizeCountry resolves canonical names and aliases', () => {
  assert.equal(normalizeCountry('uae'), 'United Arab Emirates');
  assert.equal(normalizeCountry('United Arab Emirates'), 'United Arab Emirates');
  assert.equal(normalizeCountry('KSA'), 'Saudi Arabia');
  assert.equal(normalizeCountry('saudi arabia'), 'Saudi Arabia');
  assert.equal(normalizeCountry('pak'), 'Pakistan');
  assert.equal(normalizeCountry('Egypt'), 'Egypt');
  assert.equal(normalizeCountry('unknown country'), null);
});

test('deriveRegion correctly categorizes countries', () => {
  assert.equal(deriveRegion('Pakistan'), REGIONS.PAKISTAN);
  assert.equal(deriveRegion('United Arab Emirates'), REGIONS.MENA);
  assert.equal(deriveRegion('Saudi Arabia'), REGIONS.MENA);
  assert.equal(deriveRegion('Egypt'), REGIONS.MENA);
  assert.equal(deriveRegion('Qatar'), REGIONS.MENA);
  assert.equal(deriveRegion('United Kingdom'), REGIONS.OTHER);
  assert.equal(deriveRegion(null), null);
});

test('normalizeCities handles clean, aliased, and messy inputs', () => {
  assert.deepEqual(normalizeCities('Dubai'), ['Dubai']);
  assert.deepEqual(normalizeCities(['dxb', 'auh']), ['Dubai', 'Abu Dhabi']);
  assert.deepEqual(normalizeCities('DHA Phase 6, Lahore'), ['Lahore']);
  assert.deepEqual(normalizeCities('Riyadh | Jeddah'), ['Riyadh', 'Jeddah']);
  assert.deepEqual(normalizeCities('Remote'), []);
});

test('resolveLocation infers country and region when country is omitted', () => {
  const resDubai = resolveLocation({ cities: ['Dubai'] });
  assert.equal(resDubai.country, 'United Arab Emirates');
  assert.equal(resDubai.region, REGIONS.MENA);
  assert.deepEqual(resDubai.cities, ['Dubai']);

  const resLahore = resolveLocation({ cities: ['Lahore'] });
  assert.equal(resLahore.country, 'Pakistan');
  assert.equal(resLahore.region, REGIONS.PAKISTAN);
  assert.deepEqual(resLahore.cities, ['Lahore']);

  const resRemotePak = resolveLocation({ location: 'Remote (Pakistan)' });
  assert.equal(resRemotePak.country, 'Pakistan');
  assert.equal(resRemotePak.region, REGIONS.PAKISTAN);
});

test('resolveLocation respects explicit country over conflicting city inference', () => {
  const res = resolveLocation({ country: 'United Arab Emirates', cities: ['Dubai', 'Sharjah'] });
  assert.equal(res.country, 'United Arab Emirates');
  assert.equal(res.region, REGIONS.MENA);
  assert.deepEqual(res.cities, ['Dubai', 'Sharjah']);
});
