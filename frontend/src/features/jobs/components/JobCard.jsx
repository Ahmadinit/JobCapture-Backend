import CompanyAvatar from './CompanyAvatar.jsx';
import CompanyLine from './CompanyLine.jsx';
import JobTags from './JobTags.jsx';
import { BookmarkIcon, BriefcaseIcon, CheckIcon, ChevronRightIcon, ClockIcon, MailIcon, PinIcon } from '@/components/ui/Icons.jsx';
import { capitalize, relativeTime } from '@/utils/format';
import { citiesLabel, experienceLabel } from '../utils/jobDisplay';

export default function JobCard({
  job,
  onOpen,
  isSaved = false,
  onToggleSave,
  isApplied = false,
  onMarkApplied,
}) {
  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(job);
    }
  };

  const experience = experienceLabel(job.experienceYears);
  const city = citiesLabel(job.cities);
  const locationLabel = job.country
    ? `${city ? `${city}, ` : ''}${job.country}`
    : city;

  return (
    <article
      className="job-card"
      tabIndex={0}
      role="button"
      aria-label={`${job.jobTitle} at ${job.company}`}
      onClick={() => onOpen(job)}
      onKeyDown={handleKeyDown}
    >
      <CompanyAvatar name={job.company} />

      <div className="job-main">
        <h3 className="job-title">{job.jobTitle}</h3>
        <p className="job-company"><CompanyLine job={job} /></p>

        <JobTags items={job.categories} max={3} primary className="job-categories" />

        <div className="job-meta">
          {job.contactEmail && (
            <span className="tag" data-kind="lead" title={`Direct Lead: ${job.contactEmail}`}>
              <MailIcon style={{ width: 12, height: 12, marginRight: 4, verticalAlign: -1 }} />
              Direct Lead
            </span>
          )}
          {job.remoteType && (
            <span className="tag" data-kind={job.remoteType}>
              {job.remoteScope ? `Remote (${job.remoteScope})` : capitalize(job.remoteType)}
            </span>
          )}
          {locationLabel && <span className="job-meta-item"><PinIcon />{locationLabel}</span>}
          <span className={`job-meta-item${experience ? '' : ' is-muted'}`}>
            <BriefcaseIcon />{experience || 'Experience not specified'}
          </span>
          {(job.postedAt || job.createdAt) && (
            <span className="job-meta-item" title={new Date(job.postedAt || job.createdAt).toLocaleDateString()}>
              <ClockIcon />{relativeTime(job.postedAt || job.createdAt)}
            </span>
          )}
        </div>

        {job.description && <p className="job-snippet">{job.description}</p>}

        <JobTags items={job.skills} max={5} className="job-skills" />
      </div>

      <div className="job-aside">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onToggleSave && (
            <button
              type="button"
              className={`btn-icon-card ${isSaved ? 'is-saved' : ''}`}
              title={isSaved ? 'Remove from Saved' : 'Save for later'}
              aria-label={isSaved ? 'Remove from Saved' : 'Save for later'}
              onClick={e => onToggleSave(job, e)}
            >
              <BookmarkIcon style={{ width: 14, height: 14, fill: isSaved ? 'currentColor' : 'none' }} />
            </button>
          )}
          <span
            className="job-time"
            title={job.postedAt ? `Posted: ${new Date(job.postedAt).toLocaleDateString()}` : ''}
          >
            {relativeTime(job.postedAt || job.createdAt)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
          {isApplied ? (
            <span className="tag tag-applied" title="Marked as applied">
              <CheckIcon style={{ width: 12, height: 12, marginRight: 4 }} /> Applied
            </span>
          ) : (
            onMarkApplied && (
              <button
                type="button"
                className="btn-mark-applied"
                title="Mark as applied"
                onClick={e => onMarkApplied(job, e)}
              >
                Mark Applied
              </button>
            )
          )}
          <ChevronRightIcon className="job-chevron" />
        </div>
      </div>
    </article>
  );
}
