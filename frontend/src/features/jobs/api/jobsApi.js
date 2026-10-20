import { apiGet } from '@/lib/apiClient';
import { PAGE_SIZE } from '../constants';

export function fetchJobs(filters, signal) {
  const params = { page: filters.page || 1, limit: filters.limit || PAGE_SIZE };
  if (filters.search) params.search = filters.search;
  if (filters.track) params.track = filters.track;
  if (filters.region) params.region = filters.region;
  if (filters.countries?.length) params.countries = filters.countries.join(',');
  if (filters.categories?.length) params.categories = filters.categories.join(',');
  if (filters.skills?.length) {
    params.skills = filters.skills.join(',');
    if (filters.skillsMatch === 'all') params.skillsMatch = 'all';
  }
  if (filters.cities?.length) params.cities = filters.cities.join(',');
  if (filters.remoteType?.length) params.remoteType = filters.remoteType.join(',');
  if (filters.remoteScope?.length) params.remoteScope = filters.remoteScope.join(',');
  if (filters.experience?.length) params.experience = filters.experience.join(',');

  return apiGet('/api/jobs', { params, signal });
}

// Option lists with live counts: categories, skills, cities, tracks, experience buckets...
export function fetchFacets(signal) {
  return apiGet('/api/jobs/facets', { signal });
}
