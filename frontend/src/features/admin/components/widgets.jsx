import { useState } from 'react';

export const fmt = n => (n == null ? '—' : Number(n).toLocaleString());
export const fmtDur = s => {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
};
export const fmtBytes = b => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);
export const fmtMs = ms => (ms == null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);

export function bucketLabel(bucket) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(bucket)) {
    return new Date(`${bucket}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return bucket;
}

export function Section({ title, hint, children }) {
  return (
    <section className="adm-section">
      <header className="adm-section-head">
        <h2>{title}</h2>
        {hint && <p>{hint}</p>}
      </header>
      {children}
    </section>
  );
}

export function Card({ title, children, wide }) {
  return (
    <div className={`adm-card${wide ? ' is-wide' : ''}`}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

export function Kpi({ label, value, sub, hint }) {
  return (
    <div className="adm-kpi" title={hint}>
      <span className="adm-kpi-label">{label}</span>
      <strong className="adm-kpi-value">{value}</strong>
      {sub && <span className="adm-kpi-sub">{sub}</span>}
    </div>
  );
}

export function Empty({ children = 'No data in this range.' }) {
  return <p className="adm-empty">{children}</p>;
}

// Horizontal bars: rows = [{ name, value, extra? }]
export function BarList({ rows, valueLabel, format = fmt }) {
  if (!rows?.length) return <Empty />;
  const max = Math.max(...rows.map(r => r.value), 1);
  const total = rows.reduce((n, r) => n + r.value, 0) || 1;
  return (
    <ul className="adm-bars" aria-label={valueLabel}>
      {rows.map(r => (
        <li key={r.name}>
          <span className="adm-bar-name" title={r.name}>{r.name}</span>
          <span className="adm-bar-track"><span className="adm-bar-fill" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="adm-bar-value">{format(r.value)}<small> {Math.round((r.value / total) * 100)}%</small></span>
        </li>
      ))}
    </ul>
  );
}

// Vertical columns: rows = [{ label, value }]
export function Columns({ rows, height = 130 }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div className="adm-cols" style={{ height }}>
      {rows.map(r => (
        <div className="adm-col" key={r.label} title={`${r.label}: ${fmt(r.value)}`}>
          <span className="adm-col-bar" style={{ height: `${(r.value / max) * 100}%` }} />
          <span className="adm-col-label">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Funnel({ steps }) {
  const top = Math.max(steps[0]?.sessions || 0, 1);
  return (
    <ol className="adm-funnel">
      {steps.map((s, i) => (
        <li key={s.step}>
          <div className="adm-funnel-row">
            <span>{s.step}</span>
            <strong>{fmt(s.sessions)}</strong>
          </div>
          <span className="adm-bar-track"><span className="adm-bar-fill" style={{ width: `${(s.sessions / top) * 100}%` }} /></span>
          <small>
            {Math.round((s.sessions / top) * 100)}% of visits
            {i > 0 && steps[i - 1].sessions > 0 && ` · ${Math.round((s.sessions / steps[i - 1].sessions) * 100)}% of previous step`}
          </small>
        </li>
      ))}
    </ol>
  );
}

export function DataTable({ columns, rows }) {
  if (!rows?.length) return <Empty />;
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>{columns.map(c => <th key={c.key} className={c.num ? 'num' : ''}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{columns.map(c => <td key={c.key} className={c.num ? 'num' : ''}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SERIES = [
  { key: 'visitors', label: 'Visitors', cls: 's1' },
  { key: 'sessions', label: 'Visits', cls: 's2' },
  { key: 'pageviews', label: 'Page views', cls: 's3' },
];

export function LineChart({ series }) {
  const [hover, setHover] = useState(null);
  const W = 800, H = 240, PAD = { l: 38, r: 12, t: 12, b: 26 };
  if (!series?.length) return <Empty />;
  const max = Math.max(...series.flatMap(p => SERIES.map(s => p[s.key])), 1);
  const niceMax = Math.ceil(max / 5) * 5 || 5;
  const x = i => PAD.l + (series.length === 1 ? (W - PAD.l - PAD.r) / 2 : (i / (series.length - 1)) * (W - PAD.l - PAD.r));
  const y = v => PAD.t + (1 - v / niceMax) * (H - PAD.t - PAD.b);
  const path = key => series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(niceMax * f));
  const labelEvery = Math.ceil(series.length / 8);
  const active = hover == null ? null : series[hover];

  const onMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, idx)));
  };

  return (
    <div className="adm-chart">
      <div className="adm-legend">
        {SERIES.map(s => (
          <span key={s.key} className={`adm-legend-item ${s.cls}`}>
            <i /> {s.label}{active ? <strong> {fmt(active[s.key])}</strong> : null}
          </span>
        ))}
        <span className="adm-legend-date">{active ? bucketLabel(active.bucket) : ''}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Visitors, visits and page views over time"
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {ticks.map(t => (
          <g key={t}>
            <line className="adm-gridline" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
            <text className="adm-axis" x={PAD.l - 6} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}
        {series.map((p, i) => i % labelEvery === 0 && (
          <text key={p.bucket} className="adm-axis" x={x(i)} y={H - 8} textAnchor="middle">{bucketLabel(p.bucket)}</text>
        ))}
        {SERIES.map(s => <path key={s.key} className={`adm-line ${s.cls}`} d={path(s.key)} />)}
        {hover != null && (
          <g>
            <line className="adm-cursor" x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} />
            {SERIES.map(s => <circle key={s.key} className={`adm-dot ${s.cls}`} cx={x(hover)} cy={y(series[hover][s.key])} r="4" />)}
          </g>
        )}
        {series.length <= 60 && SERIES.map(s => series.map((p, i) => (
          <circle key={`${s.key}${i}`} className={`adm-dot small ${s.cls}`} cx={x(i)} cy={y(p[s.key])} r="2" />
        )))}
      </svg>
    </div>
  );
}
