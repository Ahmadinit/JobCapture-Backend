import CompanyAvatar from '@/features/jobs/components/CompanyAvatar.jsx';
import JobTags from '@/features/jobs/components/JobTags.jsx';
import { ChevronRightIcon } from '@/components/ui/Icons.jsx';
import { relativeTime } from '@/utils/format';

export default function CompanyCard({ company, onOpen }) {
  const { name, openJobs, totalJobs, size, topSkills, lastPostedAt } = company;
  const onKey = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(company);
    }
  };
  return (
    <article className="company-card" tabIndex={0} role="button" aria-label={`${name}: ${openJobs} open roles`} onClick={() => onOpen(company)} onKeyDown={onKey}>
      <div className="company-card-top">
        <CompanyAvatar name={name} />
        <div className="company-card-title">
          <h3>{name}</h3>
          <p>{size ? `${size} employees` : 'Size not listed'}</p>
        </div>
        <ChevronRightIcon className="job-chevron" />
      </div>

      <div className="company-card-counts">
        <span className={`count-pill${openJobs ? ' is-open' : ''}`}>{openJobs} open</span>
        <span className="count-pill">{totalJobs} seen in total</span>
      </div>

      <JobTags items={topSkills} max={4} />
      <p className="company-card-foot">Last posted {relativeTime(lastPostedAt)}</p>
    </article>
  );
}
