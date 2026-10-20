import { useState } from 'react';
import JobTags from '@/features/jobs/components/JobTags.jsx';
import { capitalize } from '@/utils/format';
import { citiesLabel, experienceLabel } from '@/features/jobs/utils/jobDisplay';

const fmt = iso => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric', day: 'numeric' }) : null);

// An older posting that has since closed. Expands to show everything we kept about it.
export default function PastJob({ job }) {
  const [open, setOpen] = useState(false);
  const exp = experienceLabel(job.experienceYears);
  const facts = [
    ['Posted', fmt(job.createdAt)],
    ['Closed', fmt(job.closedAt)],
    ['Work type', job.remoteType ? capitalize(job.remoteType) : null],
    ['Experience', exp],
    ['Location', citiesLabel(job.cities)],
  ].filter(([, v]) => v);

  return (
    <div className={`past-job${open ? ' is-open' : ''}`}>
      <button className="past-job-head" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="past-job-title">{job.jobTitle}</span>
        <span className="past-job-date">{fmt(job.createdAt)}</span>
        <span className="past-job-caret" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {!open && <JobTags items={job.skills} max={4} className="past-job-skills" />}
      {open && (
        <div className="past-job-body">
          <dl className="facts">
            {facts.map(([label, value]) => (
              <div className="fact" key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
          {job.categories?.length > 0 && <JobTags items={job.categories} max={job.categories.length} primary />}
          {job.skills?.length > 0 && <JobTags items={job.skills} max={job.skills.length} />}
          {job.description && <p className="modal-description">{job.description}</p>}
          <div className="past-job-links">
            {job.contactEmail && <a href={`mailto:${job.contactEmail}`}>{job.contactEmail}</a>}
            {job.sourceUrl && /^https?:\/\//i.test(job.sourceUrl) && (
              <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">View original post</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
