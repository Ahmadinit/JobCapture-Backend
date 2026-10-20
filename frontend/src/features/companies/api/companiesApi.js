import { apiGet, apiPost } from '@/lib/apiClient';

export const fetchCompanies = (params, signal) => apiGet('/api/companies', { params, signal });
export const fetchCompany = (key, signal) => apiGet(`/api/companies/${encodeURIComponent(key)}`, { signal });
export const submitCompanyInfo = (key, body) => apiPost(`/api/companies/${encodeURIComponent(key)}/submissions`, body);
