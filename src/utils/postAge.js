// Parses relative post age strings (e.g. "2h", "3d", "1w", "2w", "1mo", "3mo") into an approximate
// Date and flags whether the post is stale (> 30 days old).

const STALE_CUTOFF_DAYS = 30;

function parsePostAge(rawAge, referenceDate = new Date()) {
  if (!rawAge || typeof rawAge !== 'string') {
    return { postedAt: null, isStale: false, ageDays: null };
  }

  const cleaned = rawAge.trim().toLowerCase();

  // Explicit stale indicators
  if (cleaned.includes('>30') || cleaned.includes('> 30') || /^[2-9]\s*mo/i.test(cleaned) || /\d+\s*y/i.test(cleaned)) {
    return { postedAt: null, isStale: true, ageDays: 60 };
  }

  const match = cleaned.match(/^(\d+)\s*([mhdwy])/i) || cleaned.match(/^(\d+)\s*(min|hour|hr|day|week|wk|month|mo|year|yr)/i);
  if (!match) {
    return { postedAt: null, isStale: false, ageDays: null };
  }

  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  let ms = 0;
  let ageDays = 0;

  if (unit === 'm' || unit.startsWith('min')) {
    ms = val * 60 * 1000;
    ageDays = val / (60 * 24);
  } else if (unit === 'h' || unit.startsWith('h')) {
    ms = val * 60 * 60 * 1000;
    ageDays = val / 24;
  } else if (unit === 'd' || unit.startsWith('day')) {
    ms = val * 24 * 60 * 60 * 1000;
    ageDays = val;
  } else if (unit === 'w' || unit.startsWith('w')) {
    ms = val * 7 * 24 * 60 * 60 * 1000;
    ageDays = val * 7;
  } else if (unit === 'mo' || unit.startsWith('month')) {
    ms = val * 30 * 24 * 60 * 60 * 1000;
    ageDays = val * 30;
  } else if (unit === 'y' || unit.startsWith('yr') || unit.startsWith('year')) {
    ms = val * 365 * 24 * 60 * 60 * 1000;
    ageDays = val * 365;
  }

  const isStale = ageDays > STALE_CUTOFF_DAYS;
  const postedAt = new Date(referenceDate.getTime() - ms);

  return { postedAt, isStale, ageDays };
}

module.exports = { parsePostAge, STALE_CUTOFF_DAYS };
