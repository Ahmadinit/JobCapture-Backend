import { TRACK_OPTIONS } from '../constants';

export default function TrackSwitch({ value, counts, total, onChange }) {
  const countFor = v => (v === '' ? total : counts?.[v]);
  return (
    <div className="segmented" role="radiogroup" aria-label="Job type">
      {TRACK_OPTIONS.map(o => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`segment${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {countFor(o.value) != null && <span className="segment-count">{countFor(o.value)}</span>}
        </button>
      ))}
    </div>
  );
}
