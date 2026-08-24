import { ALL_TYPES } from '../typeColors'

const REGIONS = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola']
const GENERATIONS = [1, 2, 3, 4, 5, 6, 7]
const RARITIES = ['Common', 'Legendary']

export default function FilterBar({ filters, onChange }) {
  const update = (key) => (e) => onChange({ ...filters, [key]: e.target.value })

  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Search by name..."
        value={filters.search}
        onChange={update('search')}
        className="search-input"
      />
      <select value={filters.type} onChange={update('type')}>
        <option value="">All types</option>
        {ALL_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <select value={filters.region} onChange={update('region')}>
        <option value="">All regions</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select value={filters.generation} onChange={update('generation')}>
        <option value="">All generations</option>
        {GENERATIONS.map((g) => (
          <option key={g} value={g}>Gen {g}</option>
        ))}
      </select>
      <select value={filters.rarity} onChange={update('rarity')}>
        <option value="">All rarities</option>
        {RARITIES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  )
}
