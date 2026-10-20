import { useState } from 'react';
import { track } from '@/features/analytics';
import { submitCompanyInfo } from '../api/companiesApi';

const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

// Community suggestions: held for admin review, so nothing here shows publicly straight away.
export default function SuggestForm({ companyKey }) {
  const [email, setEmail] = useState('');
  const [size, setSize] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — real users leave it empty
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ kind: '', text: '' });

  const send = async (type, value, reset) => {
    setBusy(true);
    setMessage({ kind: '', text: '' });
    try {
      const res = await submitCompanyInfo(companyKey, { type, value, website });
      track('company_submit', { type });
      reset('');
      setMessage({ kind: 'ok', text: res.message });
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="suggest">
      <p className="suggest-intro">Know something we don’t? Suggestions are reviewed before they appear.</p>
      <div className="suggest-grid">
        <form onSubmit={e => { e.preventDefault(); send('email', email, setEmail); }}>
          <label htmlFor="sg-email">Hiring / careers email</label>
          <div className="suggest-row">
            <input id="sg-email" className="input" type="email" placeholder="careers@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <button className="btn btn-secondary" type="submit" disabled={busy || !email}>Suggest</button>
          </div>
        </form>
        <form onSubmit={e => { e.preventDefault(); send('size', size, setSize); }}>
          <label htmlFor="sg-size">Company size (employees)</label>
          <div className="suggest-row">
            <select id="sg-size" className="input" value={size} onChange={e => setSize(e.target.value)} required>
              <option value="">Choose…</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-secondary" type="submit" disabled={busy || !size}>Suggest</button>
          </div>
        </form>
      </div>
      <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={e => setWebsite(e.target.value)} name="website" />
      {message.text && <p className={`suggest-msg is-${message.kind}`} role="status">{message.text}</p>}
    </div>
  );
}
