import { BriefcaseIcon } from '@/components/ui/Icons.jsx';
import { Link, usePath } from '@/lib/router';

const NAV = [
  { to: '/', label: 'Jobs', match: p => p === '/' },
  { to: '/companies', label: 'Companies', match: p => p.startsWith('/companies') },
];

export default function Header() {
  const path = usePath();
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand" aria-label="JobCapture home">
          <span className="brand-mark"><BriefcaseIcon /></span>
          <span className="brand-name">JobCapture</span>
        </Link>
        <nav className="topnav" aria-label="Main">
          {NAV.map(item => (
            <Link key={item.to} to={item.to} className={item.match(path) ? 'is-active' : ''} aria-current={item.match(path) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <span className="topbar-note">Roles shared by people we know</span>
      </div>
    </header>
  );
}
