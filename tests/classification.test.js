const test = require('node:test');
const assert = require('node:assert/strict');
const { buildClassification } = require('../src/services/classificationService');

test('buildClassification resolves tech role with MENA location', () => {
  const result = buildClassification({
    categories: ['AI / ML Engineering'],
    skills: ['Python', 'PyTorch'],
    cities: ['Dubai'],
  });

  assert.deepEqual(result.categories, ['AI / ML Engineering']);
  assert.deepEqual(result.skills, ['Python', 'PyTorch']);
  assert.deepEqual(result.cities, ['Dubai']);
  assert.equal(result.country, 'United Arab Emirates');
  assert.equal(result.region, 'MENA');
  assert.equal(result.track, 'tech');
});

test('buildClassification handles explicit country and Pakistan city', () => {
  const result = buildClassification({
    categories: ['DevOps & Cloud'],
    skills: ['Docker', 'Kubernetes'],
    country: 'Pakistan',
    cities: ['Lahore'],
  });

  assert.equal(result.country, 'Pakistan');
  assert.equal(result.region, 'Pakistan');
  assert.deepEqual(result.cities, ['Lahore']);
});

test('buildClassification infers country from aliased string in location', () => {
  const result = buildClassification({
    categories: ['Backend'],
    skills: ['Node.js'],
    location: 'Remote (KSA)',
  });

  assert.equal(result.country, 'Saudi Arabia');
  assert.equal(result.region, 'MENA');
});
