import { Link, useParams } from 'react-router-dom'
import TypeBadge from './TypeBadge'
import RarityBadge from './RarityBadge'
import EvolutionChain from './EvolutionChain'

export default function PokemonDetail({ pokemonList }) {
  const { id } = useParams()
  const pokemon = pokemonList.find((p) => p.id === Number(id))
  const knownIds = new Set(pokemonList.map((p) => p.id))
  const nameById = new Map(pokemonList.map((p) => [p.id, p.name]))

  if (!pokemon) {
    return (
      <div className="detail-page">
        <p>Pokémon not found.</p>
        <Link to="/">Back to list</Link>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">← Back</Link>
      <div className="screen">
        <div className="detail-header">
          <img src={pokemon.image} alt={pokemon.name} className="detail-image" />
          <div className="detail-info">
            <span className="detail-id">#{String(pokemon.id).padStart(3, '0')}</span>
            <h1>{pokemon.name}</h1>
            <div className="type-badge-row">
              {pokemon.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            <dl className="detail-facts">
              <dt>Japanese Name</dt>
              <dd>{pokemon.japaneseName}</dd>
              <dt>Classification</dt>
              <dd>{pokemon.classification}</dd>
              <dt>Region</dt>
              <dd>{pokemon.region}</dd>
              <dt>Generation</dt>
              <dd>Gen {pokemon.generation}</dd>
              <dt>Rarity</dt>
              <dd><RarityBadge rarity={pokemon.rarity} /></dd>
              <dt>Weight</dt>
              <dd>{pokemon.weightKg} kg</dd>
              <dt>Speed</dt>
              <dd>{pokemon.speed}</dd>
            </dl>
          </div>
        </div>

        <section className="weaknesses-section">
          <h2>Abilities</h2>
          <div className="ability-badge-row">
            {pokemon.abilities.map((a) => (
              <span key={a.name} className="ability-badge">
                {a.name}
                {a.hidden && <span className="ability-hidden-tag"> (Hidden)</span>}
              </span>
            ))}
          </div>
        </section>

        <section className="weaknesses-section">
          <h2>Strengths</h2>
          {pokemon.strengths.length === 0 ? (
            <p className="no-evolution">Not especially effective against any type.</p>
          ) : (
            <div className="type-badge-row">
              {pokemon.strengths.map((s) => (
                <TypeBadge key={s.type} type={s.type} />
              ))}
            </div>
          )}
        </section>

        <section className="weaknesses-section">
          <h2>Weaknesses</h2>
          {pokemon.weaknesses.length === 0 ? (
            <p className="no-evolution">No significant weaknesses.</p>
          ) : (
            <div className="type-badge-row">
              {pokemon.weaknesses.map((w) => (
                <TypeBadge key={w.type} type={w.type} multiplier={w.multiplier} />
              ))}
            </div>
          )}
        </section>

        <section className="evolution-section">
          <h2>Evolution Chain</h2>
          <EvolutionChain chain={pokemon.evolutionChain} knownIds={knownIds} nameById={nameById} />
        </section>
      </div>
    </div>
  )
}
