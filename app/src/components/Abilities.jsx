import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

// Builds the reverse index (ability name -> description + every Pokemon that
// has it) client-side from the already-loaded pokemonList, the same
// aggregation pattern TeamBuilder uses for weakness/strength analysis - no
// pipeline changes needed since every Pokemon's abilities already carry a
// description.
function buildAbilitiesIndex(pokemonList) {
  const map = new Map()
  for (const p of pokemonList) {
    for (const a of p.abilities) {
      if (!map.has(a.name)) {
        map.set(a.name, { name: a.name, description: a.description, pokemon: [] })
      }
      map.get(a.name).pokemon.push({ id: p.id, name: p.name, hidden: a.hidden })
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export default function Abilities({ pokemonList }) {
  const [search, setSearch] = useState('')
  const abilitiesIndex = useMemo(() => buildAbilitiesIndex(pokemonList), [pokemonList])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return abilitiesIndex
    return abilitiesIndex.filter((a) => a.name.toLowerCase().includes(q))
  }, [abilitiesIndex, search])

  return (
    <div className="abilities-page">
      <h1>Abilities</h1>
      <p className="team-subtitle">Every ability across Gen I–VII, what it does, and who has it.</p>
      <input
        type="text"
        placeholder="Search abilities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input abilities-search"
      />
      <p className="result-count">{filtered.length} abilities</p>
      <div className="screen">
        <div className="abilities-list">
          {filtered.map((a) => (
            <div className="ability-card" key={a.name}>
              <div className="ability-card-header">
                <h2>{a.name}</h2>
                <span className="ability-card-count">
                  {a.pokemon.length} Pokémon
                </span>
              </div>
              {a.description && <p className="ability-card-description">{a.description}</p>}
              <div className="ability-card-pokemon">
                {a.pokemon.map((p) => (
                  <Link key={p.id} to={`/pokemon/${p.id}`} className="ability-pokemon-chip">
                    {p.name}
                    {p.hidden && <span className="ability-hidden-tag"> (Hidden)</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
