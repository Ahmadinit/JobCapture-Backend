export default function CompanyAvatar({ name, large = false }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return <div className={`avatar${large ? ' avatar-lg' : ''}`} aria-hidden="true">{initial}</div>;
}
