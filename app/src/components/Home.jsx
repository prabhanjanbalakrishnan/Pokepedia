import { useMemo, useState } from 'react'
import PokemonCard from './PokemonCard'
import FilterBar from './FilterBar'

export default function Home({ pokemonList }) {
  const [filters, setFilters] = useState({
    search: '', type: '', region: '', generation: '', rarity: '',
  })

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return pokemonList.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search)) return false
      if (filters.type && !p.types.includes(filters.type)) return false
      if (filters.region && p.region !== filters.region) return false
      if (filters.generation && p.generation !== Number(filters.generation)) return false
      if (filters.rarity && p.rarity !== filters.rarity) return false
      return true
    })
  }, [pokemonList, filters])

  return (
    <div className="home-page">
      <h1>Pokepedia</h1>
      <FilterBar filters={filters} onChange={setFilters} />
      <p className="result-count">{filtered.length} Pokémon</p>
      <div className="screen">
        <div className="pokemon-grid">
          {filtered.map((p) => (
            <PokemonCard key={p.id} pokemon={p} />
          ))}
        </div>
      </div>
    </div>
  )
}
