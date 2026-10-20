import { CloseIcon } from '@/components/ui/Icons.jsx';
import { EXPERIENCE_OPTIONS, REMOTE_OPTIONS } from '../constants';

const labelOf = (options, value) => options.find(o => o.value === value)?.label || value;

// One chip per active value. The track switch is shown in its own control, so it isn't a chip.
export function getActiveChips(filters) {
  const chips = [];
  if (filters.search) chips.push({ key: 'search', value: filters.search, label: `“${filters.search}”` });
  filters.countries?.forEach(v =>
    chips.push({ key: 'countries', value: v, label: v === 'unspecified' ? 'Country: Not specified' : v }),
  );
  filters.categories?.forEach(v => chips.push({ key: 'categories', value: v, label: v }));
  filters.skills?.forEach(v => chips.push({ key: 'skills', value: v, label: v }));
  filters.cities?.forEach(v =>
    chips.push({ key: 'cities', value: v, label: v === 'unspecified' ? 'City: Not specified' : v }),
  );
  filters.remoteType?.forEach(v => chips.push({ key: 'remoteType', value: v, label: labelOf(REMOTE_OPTIONS, v) }));
  filters.remoteScope?.forEach(v => chips.push({ key: 'remoteScope', value: v, label: `Scope: ${v}` }));
  filters.experience?.forEach(v =>
    chips.push({ key: 'experience', value: v, label: `Exp: ${labelOf(EXPERIENCE_OPTIONS, v)}` }),
  );
  return chips;
}

export default function ActiveFilters({ chips, onRemove }) {
  if (!chips || chips.length === 0) return null;
  return (
    <div className="active-filters">
      {chips.map(chip => (
        <span className="chip" key={`${chip.key}:${chip.value}`}>
          {chip.label}
          <button aria-label={`Remove filter ${chip.label}`} onClick={() => onRemove(chip.key, chip.value)}>
            <CloseIcon />
          </button>
        </span>
      ))}
    </div>
  );
}
