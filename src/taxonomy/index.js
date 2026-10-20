const categories = require('./categories');
const skills = require('./skills');
const cities = require('./cities');
const locations = require('./locations');
const legacy = require('./legacyStack');

// Bump when the taxonomy or classification prompt changes meaningfully.
const CLASSIFICATION_VERSION = 3;

module.exports = {
  ...categories,
  ...skills,
  ...cities,
  ...locations,
  ...legacy,
  CLASSIFICATION_VERSION,
};
