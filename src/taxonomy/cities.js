// Backwards-compatibility wrapper. Core logic lives in locations.js.
const locations = require('./locations');

module.exports = {
  KNOWN_CITIES: locations.KNOWN_CITIES,
  normalizeCities: locations.normalizeCities,
};
