import { useEffect, useMemo, useState } from 'react';
import { UnauthorizedError, fetchAnalytics } from '../api/adminApi';
import {
  BarList, Card, Columns, DataTable, Empty, Funnel, Kpi, LineChart, Section,
  fmt, fmtBytes, fmtDur, fmtMs,
} from './widgets.jsx';

const PRESETS = [
  { id: '1', label: 'Today' }, { id: '7', label: '7 days' }, { id: '30', label: '30 days' },
  { id: '90', label: '90 days' }, { id: '180', label: '180 days' }, { id: 'custom', label: 'Custom' },
];
const asRows = list => (list || []).map(r => ({ name: r.name, value: r.visitors }));
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '—');

export default function Dashboard({ onLogout }) {
  const [preset, setPreset] = useState('30');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [granularity, setGranularity] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [device, setDevice] = useState('');
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const params = useMemo(() => {
    const base = { granularity, country, city, device };
    if (preset === 'custom') return custom.from && custom.to ? { ...base, ...custom } : null;
    return { ...base, days: preset };
  }, [preset, custom, granularity, country, city, device]);

  useEffect(() => {
    if (!params) return undefined;
    const controller = new AbortController();
    setStatus('loading');
    fetchAnalytics(params, controller.signal)
      .then(d => { setData(d); setStatus('ready'); })
      .catch(err => {
        if (err.name === 'AbortError') return;
        if (err instanceof UnauthorizedError) { onLogout(); return; }
        setError(err.message);
        setStatus('error');
      });
    return () => controller.abort();
  }, [params, reload, onLogout]);

  const t = data?.totals;
  const b = data?.behavior;
  const resetFilters = () => { setCountry(''); setCity(''); setDevice(''); setGranularity(''); };

  return (
    <div className="adm">
      <header className="adm-top">
        <div>
          <h1>Analytics</h1>
          <p>
            {data ? `${data.range.from} → ${data.range.to} · ${data.range.timezone}` : 'Loading…'}
            {data && <span className="adm-live"><i /> {data.live.activeNow} active now</span>}
          </p>
        </div>
        <div className="adm-top-actions">
          <button className="btn btn-secondary" onClick={() => setReload(n => n + 1)}>Refresh</button>
          <button className="btn btn-secondary" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <div className="adm-filters">
        <div className="adm-presets" role="group" aria-label="Date range">
          {PRESETS.map(p => (
            <button key={p.id} className={preset === p.id ? 'is-on' : ''} onClick={() => setPreset(p.id)}>{p.label}</button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="adm-custom">
            <input type="date" value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} aria-label="From date" />
            <span>to</span>
            <input type="date" value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} aria-label="To date" />
          </div>
        )}
        <select value={granularity} onChange={e => setGranularity(e.target.value)} aria-label="Group by">
          <option value="">Group: auto</option>
          <option value="day">By day</option>
          <option value="week">By week</option>
          <option value="month">By month</option>
        </select>
        <select value={country} onChange={e => { setCountry(e.target.value); setCity(''); }} aria-label="Country">
          <option value="">All countries</option>
          {data?.options.countries.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={city} onChange={e => setCity(e.target.value)} aria-label="City">
          <option value="">All cities</option>
          {data?.options.cities.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={device} onChange={e => setDevice(e.target.value)} aria-label="Device">
          <option value="">All devices</option>
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
          <option value="tablet">Tablet</option>
        </select>
        {(country || city || device || granularity) && <button className="btn btn-link" onClick={resetFilters}>Reset</button>}
      </div>

      {preset === 'custom' && !params && <Empty>Choose a start and end date.</Empty>}
      {status === 'error' && (
        <div className="adm-error-box" role="alert">
          {error} <button className="btn btn-link" onClick={() => setReload(n => n + 1)}>Retry</button>
        </div>
      )}

      {data && (
        <div className={status === 'loading' ? 'adm-body is-loading' : 'adm-body'}>
          <div className="adm-kpis">
            <Kpi label="Unique visitors" value={fmt(t.visitors)} sub={`${fmt(t.newVisitors)} new · ${fmt(t.returningVisitors)} returning`} hint="New: first-ever visit, and only one visit in this period. Returning: seen before this period, or came back within it." />
            <Kpi label="Visits (sessions)" value={fmt(t.sessions)} sub={`${t.sessionsPerVisitor} per visitor`} />
            <Kpi label="Page views" value={fmt(t.pageviews)} sub={`${t.pagesPerSession} per visit`} />
            <Kpi label="Bounce rate" value={`${t.bounceRate}%`} sub="left without interacting" />
            <Kpi label="Avg. visit length" value={fmtDur(t.avgSessionSeconds)} sub={b.timeOnPageSeconds != null ? `${fmtDur(b.timeOnPageSeconds)} per page stretch` : ''} />
            <Kpi label="Jobs added" value={fmt(data.supply.total)} sub="in this range" />
          </div>

          <Section title="Traffic over time" hint={`Grouped by ${data.range.granularity}. Hover the chart for exact numbers.`}>
            <Card wide><LineChart series={data.series} /></Card>
          </Section>

          <Section title="Audience" hint="Location comes from the IP address at request time (country is reliable; city is approximate, especially on mobile networks).">
            <div className="adm-grid">
              <Card title="Countries"><BarList rows={asRows(data.audience.countries)} valueLabel="Visitors by country" /></Card>
              <Card title="Cities"><BarList rows={asRows(data.audience.cities)} /></Card>
              <Card title="Regions"><BarList rows={asRows(data.audience.regions)} /></Card>
              <Card title="Browser languages"><BarList rows={asRows(data.audience.languages)} /></Card>
              <Card title="Visitor time zones"><BarList rows={asRows(data.audience.timezones)} /></Card>
              <Card title="Return visitors">
                <DataTable
                  columns={[{ key: 'when', label: 'Came back within' }, { key: 'n', label: 'Visitors', num: true }, { key: 'p', label: 'Rate', num: true }]}
                  rows={[['d1', '1 day'], ['d7', '7 days'], ['d30', '30 days']].map(([k, label]) => ({
                    when: label, n: `${data.retention[k].returned} / ${data.retention[k].cohort}`, p: pct(data.retention[k].returned, data.retention[k].cohort),
                  }))}
                />
                <p className="adm-note">Counts visitors old enough to judge, across all stored history (not just this range).</p>
              </Card>
            </div>
          </Section>

          <Section title="Devices & browsers">
            <div className="adm-grid">
              <Card title="Device type"><BarList rows={asRows(data.tech.devices)} /></Card>
              <Card title="Operating system"><BarList rows={asRows(data.tech.os)} /></Card>
              <Card title="Browser"><BarList rows={asRows(data.tech.browsers)} /></Card>
              <Card title="Screen size"><BarList rows={asRows(data.tech.screens)} /></Card>
              <Card title="Colour theme"><BarList rows={asRows(data.tech.themes)} /></Card>
              <Card title="Connection type"><BarList rows={asRows(data.tech.connections)} /></Card>
            </div>
          </Section>

          <Section title="Where visitors come from">
            <div className="adm-grid">
              <Card title="Referrers"><BarList rows={asRows(data.sources.referrers)} /></Card>
              <Card title="Campaign sources (utm_source)"><BarList rows={asRows(data.sources.utmSources)} /></Card>
              <Card title="Pages"><BarList rows={asRows(data.sources.paths)} /></Card>
            </div>
            <p className="adm-note">Visits with no referrer are direct (typed link, bookmark, or apps such as WhatsApp that hide it).</p>
          </Section>

          <Section title="When people visit" hint="Page views by hour and weekday, in each visitor’s own local time.">
            <div className="adm-grid two">
              <Card title="By hour of day"><Columns rows={data.time.hours.map(h => ({ label: String(h.hour), value: h.views }))} /></Card>
              <Card title="By weekday"><Columns rows={data.time.weekdays.map(d => ({ label: d.name, value: d.views }))} /></Card>
            </div>
          </Section>

          <Section title="What people do">
            <div className="adm-grid">
              <Card title="Funnel (visits)"><Funnel steps={b.funnel} /></Card>
              <Card title="Scroll depth"><BarList rows={b.scrollDepth.map(s => ({ name: s.name, value: s.count }))} /></Card>
              <Card title="Tech vs non-tech switch"><BarList rows={b.trackSwitch.map(s => ({ name: s.name, value: s.count }))} /></Card>
              <Card title="Most opened jobs" wide>
                <DataTable columns={[
                  { key: 'title', label: 'Job' }, { key: 'company', label: 'Company' },
                  { key: 'opens', label: 'Opens', num: true }, { key: 'visitors', label: 'Visitors', num: true },
                ]} rows={b.topJobs} />
              </Card>
              <Card title="Most apply / email clicks" wide>
                <DataTable columns={[
                  { key: 'title', label: 'Job' }, { key: 'company', label: 'Company' }, { key: 'clicks', label: 'Clicks', num: true },
                ]} rows={b.topApplied} />
              </Card>
              <Card title="Top searches" wide>
                <DataTable columns={[
                  { key: 'q', label: 'Search' }, { key: 'count', label: 'Times', num: true },
                  { key: 'avgResults', label: 'Avg. results', num: true },
                ]} rows={b.topSearches} />
              </Card>
              <Card title="Searches with no results" wide>
                <DataTable columns={[
                  { key: 'q', label: 'Search' }, { key: 'zero', label: 'No-result times', num: true },
                ]} rows={b.zeroResultSearches} />
                <p className="adm-note">These show what people want that the board does not have yet.</p>
              </Card>
              <Card title="Filters used" wide>
                <DataTable columns={[
                  { key: 'key', label: 'Filter' }, { key: 'value', label: 'Value' }, { key: 'count', label: 'Times', num: true },
                ]} rows={b.filters} />
              </Card>
              <Card title="Paging">
                {b.paging
                  ? <p>{fmt(b.paging.changes)} page changes · deepest page reached {b.paging.deepest} · average page {b.paging.avgPage}</p>
                  : <Empty />}
              </Card>
            </div>
          </Section>

          <Section title="Jobs board activity" hint="Jobs added in this range (not affected by the audience filters).">
            <div className="adm-grid">
              <Card title="Jobs added per day" wide>
                <Columns height={110} rows={data.supply.submissionsPerDay.slice(-60).map(d => ({ label: d.day.slice(8), value: d.count }))} />
              </Card>
              <Card title="Track"><BarList rows={data.supply.byTrack.map(s => ({ name: s.name, value: s.count }))} /></Card>
              <Card title="Top categories"><BarList rows={data.supply.topCategories.map(s => ({ name: s.name, value: s.count }))} /></Card>
              <Card title="Top skills"><BarList rows={data.supply.topSkills.map(s => ({ name: s.name, value: s.count }))} /></Card>
              <Card title="Top cities"><BarList rows={data.supply.topCities.map(s => ({ name: s.name, value: s.count }))} /></Card>
              <Card title="Submission processing">
                <p>{fmt(data.supply.ingest.ok)} succeeded · {fmt(data.supply.ingest.failed)} failed · avg {fmtMs(data.supply.ingest.avgMsOk)}</p>
                {data.supply.ingest.failReasons.length > 0 && (
                  <DataTable columns={[{ key: 'reason', label: 'Failure' }, { key: 'by', label: 'By' }, { key: 'count', label: 'Times', num: true }]} rows={data.supply.ingest.failReasons} />
                )}
                <p className="adm-note">Counted from when this feature was deployed.</p>
              </Card>
            </div>
          </Section>

          <Section title="Speed & errors">
            <div className="adm-grid">
              <Card title="Page load time">
                <p>Average <strong>{fmtMs(data.quality.pageLoad.avg)}</strong> · median {fmtMs(data.quality.pageLoad.p50)} · slowest 5% {fmtMs(data.quality.pageLoad.p95)}</p>
                <p className="adm-note">{fmt(data.quality.pageLoad.samples)} measurements</p>
              </Card>
              <Card title="Slow or failing API calls" wide>
                <DataTable columns={[
                  { key: 'endpoint', label: 'Endpoint' }, { key: 'kind', label: 'Kind' }, { key: 'count', label: 'Times', num: true },
                  { key: 'avgMs', label: 'Avg. time', num: true, render: r => fmtMs(r.avgMs) }, { key: 'status', label: 'Status', num: true },
                ]} rows={data.quality.apiIssues} />
              </Card>
              <Card title="Recent errors" wide>
                <DataTable columns={[
                  { key: 'ts', label: 'When', render: r => new Date(r.ts).toLocaleString() }, { key: 'type', label: 'Type' },
                  { key: 'message', label: 'Message' }, { key: 'detail', label: 'Detail' }, { key: 'browser', label: 'Browser' },
                ]} rows={data.quality.recentErrors} />
              </Card>
            </div>
          </Section>

          <Section title="Data footprint">
            <Card>
              <p>
                {fmt(data.storage.events)} stored events · about {fmtBytes(data.storage.bytes)}{data.storage.estimated ? ' (estimated)' : ''}
                {' '}· kept for {data.storage.retentionDays} days{data.storage.oldest ? ` · oldest ${new Date(data.storage.oldest).toLocaleDateString()}` : ''}
              </p>
              <p className="adm-note">Raw events expire automatically. The free Atlas tier holds 512 MB in total, shared with your jobs.</p>
            </Card>
          </Section>
        </div>
      )}

      {status === 'loading' && !data && <Empty>Loading analytics…</Empty>}
    </div>
  );
}
