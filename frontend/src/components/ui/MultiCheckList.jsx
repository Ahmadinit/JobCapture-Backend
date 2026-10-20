import { useMemo, useState } from 'react';
import { SearchIcon } from '@/components/ui/Icons.jsx';

// Checkbox list for multi-select filters, with optional search and "show more".
// options: [{ value, label, count? }]; selected: string[]
export default function MultiCheckList({
  name,
  options,
  selected,
  onToggle,
  searchable = false,
  searchPlaceholder = 'Search',
  initialVisible = 8,
}) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return options.filter(o => o.label.toLowerCase().includes(q));
    if (expanded) return options;
    // Collapsed: top N, but never hide a selected option.
    const top = options.slice(0, initialVisible);
    const hiddenSelected = options.slice(initialVisible).filter(o => selected.includes(o.value));
    return [...top, ...hiddenSelected];
  }, [options, query, expanded, initialVisible, selected]);

  const hiddenCount = options.length - visible.length;

  return (
    <div className="checklist">
      {searchable && (
        <div className="checklist-search">
          <SearchIcon />
          <input
            className="input"
            type="search"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      )}

      <ul className="checklist-items">
        {visible.map(o => (
          <li key={o.value}>
            <label className="check">
              <input
                type="checkbox"
                name={name}
                checked={selected.includes(o.value)}
                onChange={() => onToggle(o.value)}
              />
              <span className="check-label">{o.label}</span>
              {o.count != null && <span className="check-count">{o.count}</span>}
            </label>
          </li>
        ))}
        {visible.length === 0 && <li className="checklist-empty">No matches</li>}
      </ul>

      {!query && (hiddenCount > 0 || expanded) && options.length > initialVisible && (
        <button type="button" className="btn btn-link" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less' : `Show ${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}
