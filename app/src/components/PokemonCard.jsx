import { Link } from 'react-router-dom'
import TypeBadge from './TypeBadge'

export default function PokemonCard({ pokemon }) {
  return (
    <Link to={`/pokemon/${pokemon.id}`} className="pokemon-card">
      <span className="pokemon-card-id">#{String(pokemon.id).padStart(3, '0')}</span>
      <img src={pokemon.image} alt={pokemon.name} loading="lazy" />
      <h3>{pokemon.name}</h3>
      <div className="type-badge-row">
        {pokemon.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
      <span className="pokemon-card-gen">Gen {pokemon.generation}</span>
    </Link>
  )
}
