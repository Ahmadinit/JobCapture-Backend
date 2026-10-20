import { useEffect, useState } from 'react';
import { fetchFacets } from '../api/jobsApi';

// Loads filter options + counts once. The UI still works (with empty option lists) if this fails.
export function useFacets() {
  const [facets, setFacets] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchFacets(controller.signal)
      .then(setFacets)
      .catch(err => { if (err.name !== 'AbortError') setFacets(null); });
    return () => controller.abort();
  }, []);

  return facets;
}
