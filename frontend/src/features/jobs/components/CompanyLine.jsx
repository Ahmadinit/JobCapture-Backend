export default function CompanyLine({ job }) {
  return (
    <>
      {job.company}
      {job.isCompanyNameFallback && <span className="note"> · posted by, no company listed</span>}
    </>
  );
}
