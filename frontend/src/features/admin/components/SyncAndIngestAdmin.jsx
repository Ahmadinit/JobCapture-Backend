import { useEffect, useState } from 'react';
import { archiveStaleRoles, fetchSyncStatus, quickIngestJob, triggerJobSync } from '../api/adminApi';

export default function SyncAndIngestAdmin({ onLogout }) {
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [syncError, setSyncError] = useState('');

  const [keywords, setKeywords] = useState('software engineer, full stack developer');
  const [locations, setLocations] = useState('Pakistan, Dubai, Riyadh');
  const [limit, setLimit] = useState(10);

  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveMsg, setArchiveMsg] = useState('');
  const [archiveError, setArchiveError] = useState('');

  const [rawText, setRawText] = useState('');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [ingestError, setIngestError] = useState('');

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetchSyncStatus();
      setSyncStatus(res);
    } catch {
      // ignore
    }
  };

  const handleTrigger = async () => {
    setSyncLoading(true);
    setSyncMsg('');
    setSyncError('');
    try {
      const res = await triggerJobSync({ keywords, locations, limit });
      setSyncMsg(res.message);
      await loadStatus();
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleArchiveStale = async () => {
    if (!window.confirm('Archive all open jobs older than 3 days? They will be removed from candidates Explore tab but kept in DB for deduplication.')) return;
    setArchiveLoading(true);
    setArchiveMsg('');
    setArchiveError('');
    try {
      const res = await archiveStaleRoles();
      setArchiveMsg(res.message);
    } catch (err) {
      setArchiveError(err.message);
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (ingestLoading || !rawText.trim()) return;
    setIngestLoading(true);
    setIngestResult(null);
    setIngestError('');
    try {
      const res = await quickIngestJob(rawText);
      setIngestResult(res);
      setRawText('');
    } catch (err) {
      setIngestError(err.message);
    } finally {
      setIngestLoading(false);
    }
  };

  return (
    <div className="adm">
      <header className="adm-top">
        <div>
          <h1>Fetch & Ingest</h1>
          <p>Explicitly populate jobs on demand via GitHub Actions or live LLM parsing.</p>
        </div>
        <div className="adm-top-actions">
          <button className="btn btn-secondary" onClick={loadStatus}>Refresh Status</button>
          <button className="btn btn-secondary" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Section 1: Trigger Live Harvester */}
        <div className="adm-card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. Live Harvester Worker</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Scrapes fresh (≤ 3 days) tech jobs from LinkedIn &amp; Indeed for Pakistan and GCC directly into the database.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Target Keywords (comma-separated)</label>
              <input
                className="input"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="e.g. software engineer, full stack developer"
                style={{ height: '36px', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Target Locations (comma-separated)</label>
              <input
                className="input"
                value={locations}
                onChange={e => setLocations(e.target.value)}
                placeholder="e.g. Pakistan, Dubai, Riyadh"
                style={{ height: '36px', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Jobs per Target</label>
              <select
                className="select"
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                style={{ height: '36px', fontSize: '0.85rem' }}
              >
                <option value={5}>5 jobs per target (Fast test)</option>
                <option value={10}>10 jobs per target (Recommended)</option>
                <option value={20}>20 jobs per target (Deep scrape)</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
            <div><strong>Worker Mode:</strong> {syncStatus?.configured ? '🟢 GitHub Actions' : '🟢 Local Harvester Worker'}</div>
            <div><strong>Status:</strong> {syncStatus?.isRunning ? '⏳ Harvesting in progress...' : syncStatus?.canTrigger ? 'Ready to run' : `Cooldown (${syncStatus?.cooldownRemainingSec}s left)`}</div>
            {syncStatus?.lastTriggeredAt && (
              <div><strong>Last Run:</strong> {new Date(syncStatus.lastTriggeredAt).toLocaleTimeString()}</div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleTrigger}
            disabled={syncLoading || syncStatus?.isRunning || syncStatus?.canTrigger === false}
            style={{ width: '100%', padding: '0.65rem' }}
          >
            {syncLoading || syncStatus?.isRunning ? 'Harvesting Fresh Jobs…' : 'Harvest Fresh Jobs Now'}
          </button>

          {syncMsg && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#ecfdf5', color: '#065f46', borderRadius: '6px', fontSize: '0.85rem' }}>
              ✓ {syncMsg}
            </div>
          )}
          {syncError && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '0.85rem' }}>
              ✕ {syncError}
            </div>
          )}

          <hr style={{ margin: '1.25rem 0', borderColor: '#f1f5f9' }} />

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>Database Maintenance</h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Archive open jobs older than 3 days. Keeps URL deduplication intact to save LLM quota.
            </p>
            <button
              className="btn btn-secondary"
              onClick={handleArchiveStale}
              disabled={archiveLoading}
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              {archiveLoading ? 'Archiving…' : 'Archive Stale Roles (> 3 Days)'}
            </button>
            {archiveMsg && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0fdf4', color: '#166534', borderRadius: '6px', fontSize: '0.8rem' }}>
                ✓ {archiveMsg}
              </div>
            )}
            {archiveError && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '0.8rem' }}>
                ✕ {archiveError}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Direct Paste & Populate Now */}
        <div className="adm-card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>2. Explicit Job Ingest (Live LLM)</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Paste a raw job post or LinkedIn hiring update to instantly structure and insert into MongoDB.
          </p>

          <form onSubmit={handleIngest}>
            <textarea
              rows={6}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.875rem', resize: 'vertical' }}
              placeholder="e.g. Careem is hiring Senior AI Engineer in Dubai (Remote MENA). Requirements: Python, PyTorch..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={ingestLoading}
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={ingestLoading || !rawText.trim()}
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem' }}
            >
              {ingestLoading ? 'Structuring with Gemini (~8s)...' : 'Structure & Ingest Now'}
            </button>
          </form>

          {ingestResult && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#ecfdf5', color: '#065f46', borderRadius: '6px', fontSize: '0.85rem' }}>
              <strong>✓ Successfully Ingested {ingestResult.insertedCount || ingestResult.jobs?.length || 1} role(s)!</strong>
              <div style={{ marginTop: '0.25rem' }}>Company: {ingestResult.company || 'Extracted'}</div>
            </div>
          )}
          {ingestError && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '0.85rem' }}>
              ✕ {ingestError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
