import { useState } from 'react';
import MultiCheckList from '@/components/ui/MultiCheckList.jsx';
import { FilterIcon } from '@/components/ui/Icons.jsx';
import { EXPERIENCE_OPTIONS, REMOTE_OPTIONS, REMOTE_SCOPE_OPTIONS } from '../constants';

function Section({ title, badge, defaultOpen = true, children }) {
  return (
    <details className="filter-section" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {badge > 0 && <span className="filter-badge">{badge}</span>}
      </summary>
      <div className="filter-section-body">{children}</div>
    </details>
  );
}

const byCount = (a, b) => b.count - a.count || a.label.localeCompare(b.label);

// Sidebar on desktop, collapsible panel on small screens. All lists are multi-select (match ANY).
export default function FilterBar({ filters, facets, activeCount, onToggle, onUpdate, onClear }) {
  const [open, setOpen] = useState(false);

  // Country options with flags and counts
  const countryOptions = (facets?.countries || []).map(c => ({
    value: c.name,
    label: c.flag ? `${c.flag} ${c.name}` : c.name,
    count: c.count,
  }));

  const categoryOptions = (facets?.categories || [])
    .filter(c => !filters.track || c.track === filters.track)
    .filter(c => c.count > 0 || filters.categories.includes(c.name))
    .map(c => ({ value: c.name, label: c.name, count: c.count }))
    .sort(byCount);

  const skillOptions = (facets?.skills || [])
    .filter(s => s.count > 0 || filters.skills.includes(s.name))
    .map(s => ({ value: s.name, label: s.name, count: s.count }))
    .sort(byCount);

  // When a country is selected, filter cities by the selected country
  const rawCities = facets?.cities || [];
  const filteredCities = filters.countries?.length
    ? rawCities.filter(c => c.country && filters.countries.includes(c.country))
    : rawCities;

  // "Not specified" = posts that name no city. Pinned to the top so it is easy to find.
  const cityOptions = [
    ...(facets?.citiesUnspecified > 0 || filters.cities?.includes('unspecified')
      ? [{ value: 'unspecified', label: 'Not specified', count: facets?.citiesUnspecified ?? 0 }]
      : []),
    ...filteredCities.map(c => ({ value: c.name, label: c.name, count: c.count })),
  ];

  const withCounts = (options, counts) => options.map(o => ({ ...o, count: counts?.[o.value] ?? 0 }));

  return (
    <aside className={`filters${open ? ' open' : ''}`} aria-label="Filters">
      <div className="filters-header">
        <span className="filters-title">Filters{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        <button
          className="btn btn-secondary filters-toggle"
          aria-expanded={open}
          aria-controls="filters-body"
          onClick={() => setOpen(o => !o)}
        >
          <FilterIcon />
          {open ? 'Hide' : 'Show'}
        </button>
        {activeCount > 0 && (
          <button className="btn btn-link filters-clear" onClick={onClear}>Clear all</button>
        )}
      </div>

      <div className="filters-body" id="filters-body">
        {countryOptions.length > 0 && (
          <Section title="Country" badge={filters.countries?.length || 0}>
            <MultiCheckList
              name="country"
              options={countryOptions}
              selected={filters.countries || []}
              onToggle={v => onToggle('countries', v)}
              searchable={countryOptions.length > 5}
              searchPlaceholder="Search countries (e.g. UAE)"
              initialVisible={6}
            />
          </Section>
        )}

        <Section title="City" badge={filters.cities?.length || 0}>
          <MultiCheckList
            name="city"
            options={cityOptions}
            selected={filters.cities || []}
            onToggle={v => onToggle('cities', v)}
            searchable={cityOptions.length > 8}
            searchPlaceholder="Search cities"
            initialVisible={8}
          />
        </Section>

        <Section title="Work type" badge={(filters.remoteType?.length || 0) + (filters.remoteScope?.length || 0)}>
          <MultiCheckList
            name="remote"
            options={withCounts(REMOTE_OPTIONS, facets?.remoteTypes)}
            selected={filters.remoteType || []}
            onToggle={v => onToggle('remoteType', v)}
          />
          {filters.remoteType?.includes('remote') && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)', marginBottom: '0.5rem' }}>
                Remote Scope
              </p>
              <MultiCheckList
                name="remoteScope"
                options={withCounts(REMOTE_SCOPE_OPTIONS, facets?.remoteScopes)}
                selected={filters.remoteScope || []}
                onToggle={v => onToggle('remoteScope', v)}
              />
            </div>
          )}
        </Section>

        <Section title="Category" badge={filters.categories?.length || 0}>
          <MultiCheckList
            name="category"
            options={categoryOptions}
            selected={filters.categories || []}
            onToggle={v => onToggle('categories', v)}
            initialVisible={8}
          />
        </Section>

        <Section title="Skills" badge={filters.skills?.length || 0}>
          <MultiCheckList
            name="skill"
            options={skillOptions}
            selected={filters.skills || []}
            onToggle={v => onToggle('skills', v)}
            searchable
            searchPlaceholder="Search skills (e.g. Python, Docker)"
            initialVisible={10}
          />
          {filters.skills?.length > 1 && (
            <label className="check check-toggle">
              <input
                type="checkbox"
                checked={filters.skillsMatch === 'all'}
                onChange={e => onUpdate('skillsMatch', e.target.checked ? 'all' : 'any')}
              />
              <span className="check-label">Must have all selected skills</span>
            </label>
          )}
        </Section>

        <Section title="Experience" badge={filters.experience?.length || 0}>
          <MultiCheckList
            name="experience"
            options={withCounts(EXPERIENCE_OPTIONS, facets?.experience)}
            selected={filters.experience || []}
            onToggle={v => onToggle('experience', v)}
          />
        </Section>
      </div>
    </aside>
  );
}
