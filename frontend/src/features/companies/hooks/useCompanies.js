import { useEffect, useState } from 'react';
import { fetchCompanies } from '../api/companiesApi';

export const COMPANY_PAGE_SIZE = 24;

export function useCompanies({ search, sort, page }) {
  const [state, setState] = useState({ status: 'loading', result: null, error: '' });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState(s => ({ ...s, status: 'loading' }));
    const params = { sort, page, limit: COMPANY_PAGE_SIZE };
    if (search) params.search = search;
    fetchCompanies(params, controller.signal)
      .then(result => setState({ status: 'results', result, error: '' }))
      .catch(err => {
        if (err.name !== 'AbortError') setState({ status: 'error', result: null, error: err.message });
      });
    return () => controller.abort();
  }, [search, sort, page, reload]);

  return { ...state, retry: () => setReload(n => n + 1) };
}
