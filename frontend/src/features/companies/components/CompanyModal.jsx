import { useEffect, useRef, useState } from 'react';
import CompanyAvatar from '@/features/jobs/components/CompanyAvatar.jsx';
import JobCard from '@/features/jobs/components/JobCard.jsx';
import JobModal from '@/features/jobs/components/JobModal.jsx';
import JobTags from '@/features/jobs/components/JobTags.jsx';
import { CloseIcon } from '@/components/ui/Icons.jsx';
import { jobProps, track } from '@/features/analytics';
import { fetchCompany } from '../api/companiesApi';
import PastJob from './PastJob.jsx';
import SuggestForm from './SuggestForm.jsx';

const fmt = iso => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—');

export default function CompanyModal({ companyKey, onClose }) {
  const dialogRef = useRef(null);
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  const [job, setJob] = useState(null);
  const [showAllPast, setShowAllPast] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: '' });
    fetchCompany(companyKey, controller.signal)
      .then(data => {
        setState({ status: 'ready', data, error: '' });
        track('company_open', { key: data.key, name: data.name, openJobs: data.stats.openJobs });
      })
      .catch(err => {
        if (err.name !== 'AbortError') setState({ status: 'error', data: null, error: err.message });
      });
    return () => controller.abort();
  }, [companyKey]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && !job) onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, job]);

  const c = state.data;
  const past = c ? (showAllPast ? c.pastJobs : c.pastJobs.slice(0, 5)) : [];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="company-title" tabIndex={-1} ref={dialogRef}>
        <div className="modal-head">
          <CompanyAvatar name={c?.name || '?'} large />
          <div className="modal-head-text">
            <h2 id="company-title" className="modal-title">{c ? c.name : 'Loading…'}</h2>
            {c && <p className="modal-company">{c.stats.openJobs} open · {c.stats.pastJobs} past roles on this portal</p>}
          </div>
          <button className="modal-close" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="modal-body">
          {state.status === 'loading' && <p className="adm-empty">Loading company…</p>}
          {state.status === 'error' && <p role="alert">{state.error}</p>}

          {c && (
            <>
              <dl className="facts">
                <div className="fact"><dt>Company size</dt><dd>{c.size ? `${c.size} employees` : 'Not listed yet'}</dd></div>
                <div className="fact"><dt>Open roles</dt><dd>{c.stats.openJobs}</dd></div>
                <div className="fact"><dt>Roles seen in total</dt><dd>{c.stats.totalJobs}</dd></div>
                <div className="fact"><dt>First seen</dt><dd>{fmt(c.stats.firstPostedAt)}</dd></div>
                <div className="fact"><dt>Last posted</dt><dd>{fmt(c.stats.lastPostedAt)}</dd></div>
              </dl>

              <div className="modal-section">
                <h3>Contact emails</h3>
                {c.emails.length === 0 ? (
                  <p className="company-none">No email on record yet — you can suggest one below.</p>
                ) : (
                  <ul className="email-list">
                    {c.emails.map(e => (
                      <li key={e.email}>
                        <a href={`mailto:${e.email}`}>{e.email}</a>
                        {e.personal && <span className="tag tag-personal" title="A personal mailbox (Gmail, Yahoo…), often a recruiter's own">Personal</span>}
                        <span className="email-src">{e.source === 'community' ? 'suggested by the community' : `from ${e.jobs} job post${e.jobs === 1 ? '' : 's'}`}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {c.technologies.length > 0 && (
                <div className="modal-section">
                  <h3>Technologies &amp; skills</h3>
                  <div className="tag-row">
                    {c.technologies.map(t => (
                      <span className="tag" key={t.name} title={`${t.count} role${t.count === 1 ? '' : 's'}`}>
                        {t.name}<span className="tag-count">{t.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(c.categories.length > 0 || c.cities.length > 0) && (
                <div className="modal-section">
                  <h3>Hires for</h3>
                  <JobTags items={c.categories.map(x => x.name)} max={8} primary />
                  {c.cities.length > 0 && <p className="company-cities">Locations: {c.cities.map(x => x.name).join(', ')}</p>}
                </div>
              )}

              <div className="modal-section">
                <h3>Open roles ({c.openJobs.length})</h3>
                {c.openJobs.length === 0 ? (
                  <p className="company-none">No open roles right now.</p>
                ) : (
                  <div className="job-list is-compact">
                    {c.openJobs.map(j => <JobCard key={j._id} job={j} onOpen={x => { track('job_open', { ...jobProps(x), from: 'company' }); setJob(x); }} />)}
                  </div>
                )}
              </div>

              {c.pastJobs.length > 0 && (
                <div className="modal-section">
                  <h3>Past roles ({c.pastJobs.length})</h3>
                  <p className="company-none">Roles this portal picked up earlier that have since been closed.</p>
                  <div className="past-list">
                    {past.map(j => <PastJob key={j._id} job={j} />)}
                  </div>
                  {c.pastJobs.length > 5 && (
                    <button className="btn btn-link" onClick={() => setShowAllPast(v => !v)}>
                      {showAllPast ? 'Show fewer' : `Show all ${c.pastJobs.length} past roles`}
                    </button>
                  )}
                </div>
              )}

              <div className="modal-section">
                <h3>Help improve this page</h3>
                <SuggestForm companyKey={c.key} />
              </div>
            </>
          )}
        </div>
      </div>
      {job && <JobModal job={job} onClose={() => setJob(null)} />}
    </div>
  );
}
