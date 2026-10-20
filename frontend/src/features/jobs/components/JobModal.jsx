import { useEffect, useRef } from 'react';
import CompanyAvatar from './CompanyAvatar.jsx';
import CompanyLine from './CompanyLine.jsx';
import JobTags from './JobTags.jsx';
import { CloseIcon, ExternalIcon, MailIcon } from '@/components/ui/Icons.jsx';
import { jobProps, track } from '@/features/analytics';
import { capitalize } from '@/utils/format';
import { experienceLabel } from '../utils/jobDisplay';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function JobModal({ job, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const locationLabel = [
    job.cities?.length ? job.cities.join(', ') : null,
    job.country || null,
  ].filter(Boolean).join(', ') || 'Not specified';

  const facts = [
    {
      label: 'Work type',
      value: job.remoteType
        ? `${capitalize(job.remoteType)}${job.remoteScope ? ` (${job.remoteScope})` : ''}`
        : 'Not specified',
    },
    {
      label: 'Experience',
      value: job.experienceYears == null ? 'Not specified' : experienceLabel(job.experienceYears),
    },
    { label: 'Location', value: locationLabel },
    { label: 'Posted', value: formatDate(job.postedAt || job.createdAt) },
  ].filter(f => f.value);

  const hasFooter = job.applicationLink || job.contactEmail || job.sourceUrl;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal-head">
          <CompanyAvatar name={job.company} large />
          <div className="modal-head-text">
            <h2 id="modal-title" className="modal-title">{job.jobTitle}</h2>
            <p className="modal-company"><CompanyLine job={job} /></p>
          </div>
          <button className="modal-close" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="modal-body">
          {facts.length > 0 && (
            <dl className="facts">
              {facts.map(f => (
                <div className="fact" key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {job.categories?.length > 0 && (
            <div className="modal-section">
              <h3>Categories</h3>
              <JobTags items={job.categories} max={job.categories.length} primary />
            </div>
          )}

          {job.skills?.length > 0 && (
            <div className="modal-section">
              <h3>Skills</h3>
              <JobTags items={job.skills} max={job.skills.length} />
            </div>
          )}

          <div className="modal-section">
            <h3>About the role</h3>
            <p className="modal-description">{job.description || 'No description provided.'}</p>
          </div>
        </div>

        {hasFooter && (
          <div className="modal-foot">
            {job.applicationLink && (
              <a className="btn btn-primary" href={job.applicationLink} target="_blank" rel="noopener noreferrer" onClick={() => track('apply_click', jobProps(job))}>
                Apply now <ExternalIcon />
              </a>
            )}
            {job.contactEmail && (
              <a className={`btn ${job.applicationLink ? 'btn-secondary' : 'btn-primary'}`} href={`mailto:${job.contactEmail}`} onClick={() => track('email_click', jobProps(job))}>
                <MailIcon /> {job.contactEmail}
              </a>
            )}
            <span className="spacer" />
            {job.sourceUrl && (
              <a className="btn btn-link" href={job.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('source_click', jobProps(job))}>
                View original post
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
