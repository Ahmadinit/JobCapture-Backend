import { EMPTY_FILTERS } from '../constants';

const LIST_KEYS = ['countries', 'cities', 'remoteType', 'remoteScope', 'categories', 'skills', 'experience'];

const toList = value => (value ? value.split(',').map(v => v.trim()).filter(Boolean) : []);

export function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const filters = {
    ...EMPTY_FILTERS,
    search: params.get('search') || '',
    track: params.get('track') || '',
    region: params.get('region') || '',
    skillsMatch: params.get('skillsMatch') === 'all' ? 'all' : 'any',
    page: parseInt(params.get('page'), 10) || 1,
  };
  LIST_KEYS.forEach(key => { filters[key] = toList(params.get(key)); });
  return filters;
}

export function writeFiltersToUrl(f) {
  const params = new URLSearchParams();
  if (f.search) params.set('search', f.search);
  if (f.track) params.set('track', f.track);
  if (f.region) params.set('region', f.region);
  LIST_KEYS.forEach(key => { if (f[key]?.length) params.set(key, f[key].join(',')); });
  if (f.skills?.length > 1 && f.skillsMatch === 'all') params.set('skillsMatch', 'all');
  if (f.page > 1) params.set('page', f.page);
  const query = params.toString();
  window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
}
