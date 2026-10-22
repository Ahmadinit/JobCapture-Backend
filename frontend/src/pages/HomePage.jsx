import { useCallback, useState } from 'react';
import Header from '@/components/layout/Header.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import { AlertIcon, InboxIcon } from '@/components/ui/Icons.jsx';
import { jobProps, track } from '@/features/analytics';
import {
  ActiveFilters,
  FilterBar,
  JobCard,
  JobModal,
  SearchBar,
  TrackSwitch,
  getActiveChips,
  useFacets,
  useJobs,
  useUserJobState,
} from '@/features/jobs';

export default function HomePage() {
  const {
    filters, status, result, error,
    patchFilters, updateFilter, toggleValue, removeValue, clearFilters, goToPage, retry,
  } = useJobs();
  const facets = useFacets();
  const {
    isSaved,
    isApplied,
    toggleSave,
    markApplied,
    unmarkApplied,
    savedList,
    appliedList,
    savedCount,
    appliedCount,
  } = useUserJobState();

  const [activeTab, setActiveTab] = useState('explore');
  const [selectedJob, setSelectedJob] = useState(null);
  const closeModal = useCallback(() => setSelectedJob(null), []);
  const openJob = useCallback(job => {
    track('job_open', jobProps(job));
    setSelectedJob(job);
  }, []);

  const rawJobs = result?.data ?? [];
  // In Explore tab, hide jobs the candidate has already applied to
  const exploreJobs = rawJobs.filter(j => !isApplied(j._id));
  const currentJobs = activeTab === 'saved'
    ? savedList
    : activeTab === 'applied'
      ? appliedList
      : exploreJobs;

  const chips = getActiveChips(filters);
  const isEmpty = status === 'results' && currentJobs.length === 0;
  const showResults = activeTab !== 'explore' ? currentJobs.length > 0 : (status === 'results' && currentJobs.length > 0);

  let countNode = null;
  if (activeTab === 'explore' && showResults) {
    const start = (result.page - 1) * result.limit + 1;
    const end = Math.min(result.page * result.limit, result.total);
    countNode = (
      <>Showing <strong>{start}–{end}</strong> of <strong>{result.total}</strong> role{result.total === 1 ? '' : 's'}</>
    );
  } else if (activeTab === 'saved') {
    countNode = <><strong>{savedCount}</strong> saved role{savedCount === 1 ? '' : 's'}</>;
  } else if (activeTab === 'applied') {
    countNode = <><strong>{appliedCount}</strong> applied role{appliedCount === 1 ? '' : 's'}</>;
  }

  // Switching track drops any selected categories that belong to the other track.
  const handleTrack = track => {
    const trackOf = Object.fromEntries((facets?.categories || []).map(c => [c.name, c.track]));
    const categories = track ? filters.categories.filter(c => trackOf[c] === track) : filters.categories;
    patchFilters({ track, categories });
  };

  const handlePage = page => {
    goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Header />

      <main className="container">
        <div className="page-head">
          <h1 className="page-title">Open roles</h1>
          <p className="page-sub">Fresh openings shared by people we know, updated as they come in.</p>
        </div>

        <div className="board">
          <FilterBar
            filters={filters}
            facets={facets}
            activeCount={chips.length}
            onToggle={toggleValue}
            onUpdate={updateFilter}
            onClear={clearFilters}
          />

          <section aria-label="Results">
            <div className="stage-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'explore'}
                className={`stage-tab ${activeTab === 'explore' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('explore')}
              >
                Explore <span className="stage-badge">{result?.total ? Math.max(0, result.total - appliedCount) : exploreJobs.length}</span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'saved'}
                className={`stage-tab ${activeTab === 'saved' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                ⭐ Saved <span className="stage-badge">{savedCount}</span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'applied'}
                className={`stage-tab ${activeTab === 'applied' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('applied')}
              >
                💼 Applied <span className="stage-badge">{appliedCount}</span>
              </button>
            </div>

            {activeTab === 'explore' && (
              <>
                <TrackSwitch value={filters.track} counts={facets?.tracks} total={facets?.total} onChange={handleTrack} />
                <SearchBar value={filters.search} onCommit={v => updateFilter('search', v)} />
              </>
            )}

            <div className="results-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <p className="results-count" aria-live="polite" style={{ margin: 0 }}>{countNode}</p>
                {activeTab === 'explore' && (
                  <button
                    className="btn btn-secondary"
                    onClick={retry}
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Check for newly posted roles"
                    aria-label="Refresh job listings"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                    Check for new roles
                  </button>
                )}
              </div>
              {activeTab === 'explore' && <ActiveFilters chips={chips} onRemove={removeValue} />}
            </div>

            {activeTab === 'explore' && status === 'loading' && (
              <div className="job-list" aria-busy="true">
                {Array.from({ length: 5 }, (_, i) => <div className="skeleton" key={i} />)}
              </div>
            )}

            {activeTab === 'explore' && status === 'error' && (
              <div className="state" role="alert">
                <div className="state-icon is-error"><AlertIcon /></div>
                <h2>Couldn’t load jobs</h2>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={retry}>Try again</button>
              </div>
            )}

            {isEmpty && (
              <div className="state">
                <div className="state-icon"><InboxIcon /></div>
                <h2>
                  {activeTab === 'saved'
                    ? 'No saved roles yet'
                    : activeTab === 'applied'
                      ? 'No applied roles yet'
                      : 'No roles match your search'}
                </h2>
                <p>
                  {activeTab === 'saved'
                    ? 'Click the bookmark icon on any job card to save it for quick access later.'
                    : activeTab === 'applied'
                      ? 'Click "Mark Applied" on any job card once you submit your application.'
                      : 'Try different keywords or remove some filters to see more results.'}
                </p>
                {activeTab === 'explore' && (
                  <button className="btn btn-primary" onClick={clearFilters}>Clear all filters</button>
                )}
                {activeTab !== 'explore' && (
                  <button className="btn btn-primary" onClick={() => setActiveTab('explore')}>Browse explore roles</button>
                )}
              </div>
            )}

            {showResults && (
              <>
                <div className="job-list">
                  {currentJobs.map(job => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onOpen={openJob}
                      isSaved={isSaved(job._id)}
                      onToggleSave={toggleSave}
                      isApplied={isApplied(job._id)}
                      onMarkApplied={markApplied}
                    />
                  ))}
                </div>
                {activeTab === 'explore' && (
                  <Pagination page={result.page} totalPages={result.totalPages} onPage={handlePage} />
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={closeModal}
          isSaved={isSaved(selectedJob._id)}
          onToggleSave={toggleSave}
          isApplied={isApplied(selectedJob._id)}
          onMarkApplied={markApplied}
          onUnmarkApplied={unmarkApplied}
        />
      )}
    </>
  );
}
