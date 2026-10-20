import { useEffect, useState } from 'react';
import AdminLogin from './components/AdminLogin.jsx';
import Dashboard from './components/Dashboard.jsx';
import CompaniesAdmin from './components/CompaniesAdmin.jsx';
import SyncAndIngestAdmin from './components/SyncAndIngestAdmin.jsx';
import { clearToken, getToken } from './api/adminApi';
import './admin.css';

// Reachable only by typing /admin — nothing in the public site links here.
export default function AdminApp() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [tab, setTab] = useState('analytics');

  useEffect(() => {
    document.title = 'Admin';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const logout = () => {
    clearToken();
    setAuthed(false);
  };

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return (
    <>
      <nav className="adm-tabs" aria-label="Admin sections">
        <button className={tab === 'analytics' ? 'is-on' : ''} onClick={() => setTab('analytics')}>Analytics</button>
        <button className={tab === 'companies' ? 'is-on' : ''} onClick={() => setTab('companies')}>Companies</button>
        <button className={tab === 'sync' ? 'is-on' : ''} onClick={() => setTab('sync')}>Fetch & Ingest</button>
      </nav>
      {tab === 'analytics' && <Dashboard onLogout={logout} />}
      {tab === 'companies' && <CompaniesAdmin onLogout={logout} />}
      {tab === 'sync' && <SyncAndIngestAdmin onLogout={logout} />}
    </>
  );
}

