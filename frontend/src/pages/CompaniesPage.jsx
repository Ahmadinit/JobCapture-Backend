import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/layout/Header.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import DebouncedInput from '@/components/ui/DebouncedInput.jsx';
import { AlertIcon, InboxIcon, SearchIcon } from '@/components/ui/Icons.jsx';
import CompanyCard from '@/features/companies/components/CompanyCard.jsx';
import CompanyModal from '@/features/companies/components/CompanyModal.jsx';
import { useCompanies } from '@/features/companies/hooks/useCompanies';
import { navigate, usePath } from '@/lib/router';
import '@/features/companies/companies.css';

const SORTS = [
  { value: 'jobs', label: 'Most open roles' },
  { value: 'recent', label: 'Recently active' },
  { value: 'total', label: 'Most roles overall' },
  { value: 'name', label: 'Name (A–Z)' },
];

export default function CompaniesPage() {
  const path = usePath();
  const openKey = decodeURIComponent(path.replace(/^\/companies\/?/, '')) || null;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('jobs');
  const [page, setPage] = useState(1);
  const { status, result, error, retry } = useCompanies({ search, sort, page });

  useEffect(() => { document.title = 'Companies · JobCapture'; return () => { document.title = 'JobCapture'; }; }, []);

  const closeModal = useCallback(() => navigate('/companies'), []);
  const companies = result?.data ?? [];

  return (
    <>
      <Header />
      <main className="container">
        <div className="page-head">
          <h1 className="page-title">Companies hiring</h1>
          <p className="page-sub">Every company that has shared a role here, with their open roles, past roles and the technologies they use.</p>
        </div>

        <div className="companies-tools">
          <div className="search" role="search">
            <SearchIcon />
            <DebouncedInput className="input" type="search" placeholder="Search companies" aria-label="Search companies" value={search} trim onCommit={v => { setSearch(v); setPage(1); }} />
          </div>
          <label className="sort-select">
            <span>Sort by</span>
            <select className="input" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        {status === 'results' && <p className="results-count" aria-live="polite"><strong>{result.total}</strong> compan{result.total === 1 ? 'y' : 'ies'}</p>}

        {status === 'loading' && !result && (
          <div className="company-grid" aria-busy="true">{Array.from({ length: 6 }, (_, i) => <div className="skeleton" key={i} />)}</div>
        )}
        {status === 'error' && (
          <div className="state" role="alert">
            <div className="state-icon is-error"><AlertIcon /></div>
            <h2>Couldn’t load companies</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={retry}>Try again</button>
          </div>
        )}
        {status === 'results' && companies.length === 0 && (
          <div className="state">
            <div className="state-icon"><InboxIcon /></div>
            <h2>No companies match</h2>
            <p>Try a different name.</p>
            <button className="btn btn-primary" onClick={() => { setSearch(''); setPage(1); }}>Clear search</button>
          </div>
        )}
        {companies.length > 0 && (
          <>
            <div className={`company-grid${status === 'loading' ? ' is-loading' : ''}`}>
              {companies.map(c => <CompanyCard key={c.key} company={c} onOpen={x => navigate(`/companies/${x.key}`)} />)}
            </div>
            <Pagination page={result.page} totalPages={result.totalPages} onPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </>
        )}
      </main>
      {openKey && <CompanyModal companyKey={openKey} onClose={closeModal} />}
    </>
  );
}
