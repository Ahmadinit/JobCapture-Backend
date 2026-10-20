// Location & geography hierarchy for Pakistan, MENA, and international tech roles.

const REGIONS = {
  PAKISTAN: 'Pakistan',
  MENA: 'MENA',
  GLOBAL: 'Global',
  OTHER: 'Other',
};

const GEOGRAPHY = {
  Pakistan: {
    region: REGIONS.PAKISTAN,
    flag: '🇵🇰',
    aliases: ['pk', 'pak', 'pakistan', 'islamic republic of pakistan'],
    cities: [
      'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta',
      'Sialkot', 'Gujranwala', 'Gujrat', 'Hyderabad', 'Sargodha', 'Bahawalpur', 'Abbottabad',
      'Sukkur', 'Mardan', 'Wah Cantt', 'Sahiwal', 'Jhelum', 'Mirpur', 'Muzaffarabad', 'Rahim Yar Khan',
    ],
  },
  'United Arab Emirates': {
    region: REGIONS.MENA,
    flag: '🇦🇪',
    aliases: ['uae', 'united arab emirates', 'emirates', 'u.a.e.'],
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain', 'Umm Al Quwain'],
  },
  'Saudi Arabia': {
    region: REGIONS.MENA,
    flag: '🇸🇦',
    aliases: ['ksa', 'saudi', 'saudi arabia', 'kingdom of saudi arabia', 'k.s.a.'],
    cities: ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Dhahran', 'Mecca', 'Medina', 'Jubail', 'Yanbu', 'Tabuk'],
  },
  Egypt: {
    region: REGIONS.MENA,
    flag: '🇪🇬',
    aliases: ['egypt', 'are', 'arab republic of egypt'],
    cities: ['Cairo', 'Giza', 'Alexandria', 'New Cairo', '6th of October', 'Nasr City', 'Maadi', 'Smart Village', 'Mansoura'],
  },
  Qatar: {
    region: REGIONS.MENA,
    flag: '🇶🇦',
    aliases: ['qatar', 'state of qatar'],
    cities: ['Doha', 'Lusail', 'Al Rayyan', 'Al Wakrah'],
  },
  Kuwait: {
    region: REGIONS.MENA,
    flag: '🇰🇼',
    aliases: ['kuwait', 'state of kuwait'],
    cities: ['Kuwait City', 'Hawally', 'Salmiya', 'Al Ahmadi'],
  },
  Bahrain: {
    region: REGIONS.MENA,
    flag: '🇧🇭',
    aliases: ['bahrain', 'kingdom of bahrain'],
    cities: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town'],
  },
  Oman: {
    region: REGIONS.MENA,
    flag: '🇴🇲',
    aliases: ['oman', 'sultanate of oman'],
    cities: ['Muscat', 'Salalah', 'Sohar', 'Seeb'],
  },
  Jordan: {
    region: REGIONS.MENA,
    flag: '🇯🇴',
    aliases: ['jordan', 'hashemite kingdom of jordan'],
    cities: ['Amman', 'Zarqa', 'Irbid'],
  },
  Lebanon: {
    region: REGIONS.MENA,
    flag: '🇱🇧',
    aliases: ['lebanon'],
    cities: ['Beirut', 'Tripoli', 'Sidon'],
  },
  // Major global tech hubs (categorized under OTHER)
  'United Kingdom': {
    region: REGIONS.OTHER,
    flag: '🇬🇧',
    aliases: ['uk', 'united kingdom', 'great britain', 'england'],
    cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Cambridge'],
  },
  'United States': {
    region: REGIONS.OTHER,
    flag: '🇺🇸',
    aliases: ['usa', 'us', 'united states', 'united states of america'],
    cities: ['New York', 'San Francisco', 'Seattle', 'Austin', 'Boston', 'Chicago', 'Los Angeles'],
  },
  Germany: {
    region: REGIONS.OTHER,
    flag: '🇩🇪',
    aliases: ['germany', 'deutschland'],
    cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg'],
  },
  Canada: {
    region: REGIONS.OTHER,
    flag: '🇨🇦',
    aliases: ['canada'],
    cities: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
  },
  Singapore: {
    region: REGIONS.OTHER,
    flag: '🇸🇬',
    aliases: ['singapore'],
    cities: ['Singapore'],
  },
};

const COUNTRIES = Object.keys(GEOGRAPHY);

// Reverse map: city (lowercase) -> canonical Country name
const CITY_TO_COUNTRY = new Map();
for (const [country, def] of Object.entries(GEOGRAPHY)) {
  for (const city of def.cities) {
    CITY_TO_COUNTRY.set(city.toLowerCase(), country);
  }
}

// Country aliases lookup
const COUNTRY_LOOKUP = new Map();
for (const [country, def] of Object.entries(GEOGRAPHY)) {
  COUNTRY_LOOKUP.set(country.toLowerCase(), country);
  for (const alias of def.aliases) {
    COUNTRY_LOOKUP.set(alias.toLowerCase(), country);
  }
}

const CITY_ALIASES = {
  khi: 'Karachi',
  lhr: 'Lahore',
  isb: 'Islamabad',
  isl: 'Islamabad',
  rwp: 'Rawalpindi',
  pindi: 'Rawalpindi',
  dxb: 'Dubai',
  auh: 'Abu Dhabi',
  ryd: 'Riyadh',
  cai: 'Cairo',
  'delhi ncr': 'Delhi',
  'new delhi': 'Delhi',
  bengaluru: 'Bangalore',
  nyc: 'New York',
  sf: 'San Francisco',
  'sf bay area': 'San Francisco',
  'masr el-gdida - cairo': 'Cairo',
};

// Things that are not cities and must never be stored as one.
const NOT_A_CITY = new Set([
  'pakistan', 'remote', 'onsite', 'on-site', 'hybrid', 'mena', 'gcc', 'usa', 'us', 'uk', 'uae',
  'egypt', 'saudi arabia', 'india', 'canada', 'europe', 'asia', 'worldwide', 'global', 'anywhere',
  'united states', 'united kingdom', 'phase', 'dha phase', 'tbd', 'n/a', 'na', 'none', 'null',
  'ksa', 'middle east',
]);

const KNOWN_CITIES = [];
const CITY_LOOKUP = new Map();

for (const def of Object.values(GEOGRAPHY)) {
  for (const city of def.cities) {
    if (!KNOWN_CITIES.includes(city)) KNOWN_CITIES.push(city);
    CITY_LOOKUP.set(city.toLowerCase(), city);
  }
}

for (const [alias, city] of Object.entries(CITY_ALIASES)) {
  CITY_LOOKUP.set(alias.toLowerCase(), city);
}

// Longest keys first for regex greediness (e.g. "Abu Dhabi" before "Abu")
const KNOWN_CITIES_BY_LENGTH = [...CITY_LOOKUP.keys()].sort((a, b) => b.length - a.length);

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function titleCase(s) {
  return s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
}

function normalizeCountry(raw) {
  if (!raw || typeof raw !== 'string') return null;
  return COUNTRY_LOOKUP.get(raw.trim().toLowerCase()) || null;
}

function deriveRegion(country) {
  if (!country) return null;
  const canonical = normalizeCountry(country) || country;
  return GEOGRAPHY[canonical]?.region || REGIONS.OTHER;
}

// Scans known cities in a free text string
function scanKnownCities(text) {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  const hits = [];
  for (const key of KNOWN_CITIES_BY_LENGTH) {
    const match = new RegExp(`(^|[^a-z])${escapeRe(key)}([^a-z]|$)`).exec(lower);
    if (match) hits.push({ city: CITY_LOOKUP.get(key), index: match.index });
  }
  return hits;
}

// Normalizes an array or string of cities
function normalizeCities(input) {
  const rawItems = (Array.isArray(input) ? input : [input]).filter(v => typeof v === 'string' && v.trim());
  const found = [];
  const push = city => { if (city && !found.includes(city)) found.push(city); };

  for (const raw of rawItems) {
    const hits = scanKnownCities(raw).sort((a, b) => a.index - b.index);
    if (hits.length > 0) {
      hits.forEach(h => push(h.city));
      continue;
    }
    // Unknown place: accept only clean city-like words
    const cleaned = raw.replace(/\(.*?\)/g, '').split(/[,/|]/)[0].trim();
    const key = cleaned.toLowerCase();
    if (
      cleaned &&
      cleaned.length <= 30 &&
      !NOT_A_CITY.has(key) &&
      !COUNTRY_LOOKUP.has(key) &&
      !/\d|road|block|phase|town|sector|floor|street|society|market|chowk|colony/i.test(cleaned)
    ) {
      push(titleCase(cleaned));
    }
  }
  return found;
}

// Resolves Country, Region, and Cities into a single coherent location object
function resolveLocation({ cities: rawCities, country: rawCountry, location: rawLocation } = {}) {
  let country = normalizeCountry(rawCountry);
  const cities = normalizeCities(rawCities ?? rawLocation ?? null);

  // If country was not explicitly provided (or invalid), infer from the first known city
  if (!country && cities.length > 0) {
    const inferred = CITY_TO_COUNTRY.get(cities[0].toLowerCase());
    if (inferred) country = inferred;
  }

  // Check if rawLocation explicitly contains a country alias (e.g. "Remote (Pakistan)")
  if (!country && typeof rawLocation === 'string') {
    const words = rawLocation.toLowerCase().split(/[\s,()/|-]+/);
    for (const w of words) {
      const match = COUNTRY_LOOKUP.get(w);
      if (match) {
        country = match;
        break;
      }
    }
  }

  const region = deriveRegion(country);

  return {
    country,
    region,
    cities,
  };
}

module.exports = {
  REGIONS,
  GEOGRAPHY,
  COUNTRIES,
  KNOWN_CITIES,
  CITY_TO_COUNTRY,
  normalizeCountry,
  deriveRegion,
  normalizeCities,
  resolveLocation,
};
