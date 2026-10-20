export const PAGE_SIZE = 12;

export const TRACK_OPTIONS = [
  { value: '', label: 'All jobs' },
  { value: 'tech', label: 'Tech' },
  { value: 'non-tech', label: 'Non-tech' },
];

export const REMOTE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
];

export const REMOTE_SCOPE_OPTIONS = [
  { value: 'Pakistan only', label: 'Pakistan only' },
  { value: 'MENA only', label: 'MENA / GCC only' },
  { value: 'Worldwide', label: 'Worldwide' },
];

// Buckets match the backend: they filter on the post's lowest years-of-experience bound.
export const EXPERIENCE_OPTIONS = [
  { value: 'unspecified', label: 'Not specified' },
  { value: '0-1', label: '0–1 years' },
  { value: '2-3', label: '2–3 years' },
  { value: '4-6', label: '4–6 years' },
  { value: '7+', label: '7+ years' },
];

export const EMPTY_FILTERS = {
  search: '',
  track: '',
  region: '',
  countries: [],
  cities: [],
  remoteType: [],
  remoteScope: [],
  categories: [],
  skills: [],
  skillsMatch: 'any',
  experience: [],
};
