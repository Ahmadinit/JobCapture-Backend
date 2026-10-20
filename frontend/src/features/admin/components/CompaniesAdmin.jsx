import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/apiClient';
import { UnauthorizedError, adminRequest } from '../api/adminApi';
import { Card, DataTable, Empty, Section } from './widgets.jsx';

function CompanyPicker({ label, value, onPick }) {
  const [term, setTerm] = useState('');
  const [options, setOptions] = useState([]);
  useEffect(() => {
    if (term.trim().length < 2) { setOptions([]); return undefined; }
    const t = setTimeout(() => {
      apiGet('/api/companies', { params: { search: term.trim(), limit: 8, sort: 'name' } })
        .then(r => setOptions(r.data)).catch(() => setOptions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [term]);
  return (
    <div className="adm-picker">
      <label>{label}
        <input value={term} onChange={e => { setTerm(e.target.value); onPick(null); }} placeholder="Search a company…" />
      </label>
      {value ? <p className="adm-note">Selected: <strong>{value.name}</strong> ({value.key}, {value.totalJobs} roles)</p> : (
        options.length > 0 && (
          <ul className="adm-options">
            {options.map(o => (
              <li key={o.key}><button onClick={() => { onPick(o); setTerm(o.name); setOptions([]); }}>{o.name} <small>{o.totalJobs} roles</small></button></li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

export default function CompaniesAdmin({ onLogout }) {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  const guard = useCallback(err => {
    if (err instanceof UnauthorizedError) onLogout(); else setError(err.message);
  }, [onLogout]);

  const load = useCallback(() => {
    setError('');
    adminRequest('/api/admin/company-submissions', { params: { status } }).then(r => setItems(r.items)).catch(guard);
  }, [status, guard]);
  useEffect(load, [load]);

  const decide = (id, action) =>
    adminRequest(`/api/admin/company-submissions/${id}`, { method: 'PATCH', body: { action } })
      .then(() => { setNotice(`Submission ${action}d.`); load(); }).catch(guard);

  const approveAllSizes = () => {
    const n = (items || []).filter(i => i.type === 'size' && i.source === 'research').length;
    if (!n || !window.confirm(`Approve all ${n} researched company sizes? They become public immediately.`)) return;
    adminRequest('/api/admin/company-submissions/approve-all', { method: 'POST', body: { type: 'size', source: 'research' } })
      .then(r => { setNotice(`Approved ${r.approved} researched sizes.`); load(); }).catch(guard);
  };

  const merge = () => {
    if (!from || !to || from.key === to.key) return;
    if (!window.confirm(`Merge "${from.name}" into "${to.name}"? Their roles are combined and this cannot be undone.`)) return;
    adminRequest('/api/admin/companies/merge', { method: 'POST', body: { from: from.key, to: to.key } })
      .then(r => { setNotice(`Merged. ${r.movedJobs} roles moved into ${to.name}.`); setFrom(null); setTo(null); })
      .catch(guard);
  };

  return (
    <div className="adm">
      <header className="adm-top"><div><h1>Companies</h1><p>Review community suggestions and merge duplicate companies.</p></div></header>
      {error && <p className="adm-error" role="alert">{error}</p>}
      {notice && <p className="adm-live" role="status">{notice}</p>}

      <Section title="Community suggestions" hint="Nothing appears publicly until you approve it.">
        <div className="adm-presets" role="group" aria-label="Status">
          {['pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={status === s ? 'is-on' : ''} onClick={() => setStatus(s)}>{s[0].toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
        {status === 'pending' && (items || []).some(i => i.source === 'research') && (
          <p><button className="btn btn-primary" onClick={approveAllSizes}>Approve all researched sizes</button></p>
        )}
        <Card wide>
          {items === null ? <Empty>Loading…</Empty> : (
            <DataTable
              columns={[
                { key: 'companyName', label: 'Company' },
                { key: 'type', label: 'Type' },
                { key: 'value', label: 'Suggested value' },
                { key: 'source', label: 'From', render: r => (r.source === 'research' ? 'Research' : 'Community') },
                { key: 'note', label: 'Evidence', render: r => (r.note
                  ? r.note.split(' | ').map((u, i) => (/^https?:\/\//.test(u) ? <span key={i}><a href={u} target="_blank" rel="noopener noreferrer">source {i + 1}</a>{' '}</span> : <span key={i}>{u} </span>))
                  : '') },
                { key: 'createdAt', label: 'Submitted', render: r => new Date(r.createdAt).toLocaleString() },
                ...(status === 'pending' ? [{ key: 'act', label: '', render: r => (
                  <span className="adm-actions">
                    <button className="btn btn-primary" onClick={() => decide(r._id, 'approve')}>Approve</button>
                    <button className="btn btn-secondary" onClick={() => decide(r._id, 'reject')}>Reject</button>
                  </span>
                ) }] : []),
              ]}
              rows={items}
            />
          )}
        </Card>
      </Section>

      <Section title="Merge duplicate companies" hint="Names that differ by more than punctuation or Pvt/Ltd are not merged automatically.">
        <Card>
          <div className="adm-merge">
            <CompanyPicker label="Duplicate (will be removed)" value={from} onPick={setFrom} />
            <CompanyPicker label="Keep this one" value={to} onPick={setTo} />
          </div>
          <button className="btn btn-primary" disabled={!from || !to || from.key === to.key} onClick={merge}>Merge</button>
        </Card>
      </Section>
    </div>
  );
}
