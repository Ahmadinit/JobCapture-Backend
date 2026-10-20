import { useEffect, useState } from 'react';
import { fetchSyncStatus, quickIngestJob, triggerJobSync } from '../api/adminApi';

export default function SyncAndIngestAdmin({ onLogout }) {
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [syncError, setSyncError] = useState('');

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
      const res = await triggerJobSync();
      setSyncMsg(res.message);
      await loadStatus();
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) return;
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
        {/* Section 1: Trigger GitHub Actions Sync */}
        <div className="adm-card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. Actions Harvester Trigger</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Trigger the scraper runner on GitHub Actions between scheduled cron intervals.
          </p>

          <div style={{ fontSize: '0.85rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
            <div><strong>Mode:</strong> {syncStatus?.configured ? '🟢 GitHub Actions Configured' : '⚪ Local Simulation'}</div>
            <div><strong>Can Trigger Now:</strong> {syncStatus?.canTrigger ? 'Yes' : `Cooldown (${syncStatus?.cooldownRemainingSec}s left)`}</div>
            {syncStatus?.lastTriggeredAt && (
              <div><strong>Last Dispatched:</strong> {new Date(syncStatus.lastTriggeredAt).toLocaleTimeString()}</div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleTrigger}
            disabled={syncLoading || syncStatus?.canTrigger === false}
            style={{ width: '100%', padding: '0.65rem' }}
          >
            {syncLoading ? 'Dispatching…' : 'Trigger Fetch Now'}
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
              {ingestLoading ? 'Structuring with LLM (takes ~15-20s)...' : 'Structure & Ingest Now'}
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
