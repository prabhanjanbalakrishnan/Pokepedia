import { useEffect, useMemo, useState } from 'react'
import TypeBadge from './TypeBadge'
import { ALL_TYPES } from '../typeColors'

const STORAGE_KEY = 'pokepedia-team'
const MAX_TEAM_SIZE = 6

function loadTeam() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTeam(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage unavailable - team just won't persist this session
  }
}

export default function TeamBuilder({ pokemonList }) {
  const [teamIds, setTeamIds] = useState(loadTeam)
  const [search, setSearch] = useState('')

  useEffect(() => {
    saveTeam(teamIds)
  }, [teamIds])

  const byId = useMemo(() => new Map(pokemonList.map((p) => [p.id, p])), [pokemonList])
  const team = teamIds.map((id) => byId.get(id)).filter(Boolean)
  const isFull = teamIds.length >= MAX_TEAM_SIZE

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return pokemonList
      .filter((p) => p.name.toLowerCase().includes(q) && !teamIds.includes(p.id))
      .slice(0, 8)
  }, [search, pokemonList, teamIds])

  function addToTeam(id) {
    if (isFull || teamIds.includes(id)) return
    setTeamIds([...teamIds, id])
    setSearch('')
  }

  function removeFromTeam(id) {
    setTeamIds(teamIds.filter((tid) => tid !== id))
  }

  const weaknessCounts = useMemo(() => {
    const counts = new Map()
    for (const p of team) {
      for (const w of p.weaknesses) {
        counts.set(w.type, (counts.get(w.type) || 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
  }, [team])

  const coverage = useMemo(() => {
    const covered = new Set()
    for (const p of team) {
      for (const s of p.strengths) covered.add(s.type)
    }
    return covered
  }, [team])

  const gapTypes = ALL_TYPES.filter((t) => !coverage.has(t))

  return (
    <div className="team-page">
      <h1>Team Builder</h1>
      <p className="team-subtitle">Build a team of up to 6 Pokémon and see how it holds up.</p>

      <div className="team-roster">
        {Array.from({ length: MAX_TEAM_SIZE }).map((_, i) => {
          const p = team[i]
          if (!p) {
            return (
              <div key={`empty-${i}`} className="team-slot empty">
                Empty slot
              </div>
            )
          }
          return (
            <div key={p.id} className="team-slot">
              <button
                className="team-slot-remove"
                onClick={() => removeFromTeam(p.id)}
                aria-label={`Remove ${p.name}`}
              >
                ×
              </button>
              <img src={p.image} alt={p.name} />
              <span className="team-slot-name">{p.name}</span>
              <div className="type-badge-row">
                {p.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="team-add">
        <input
          type="text"
          placeholder={isFull ? 'Team is full (6/6)' : 'Search by name to add...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isFull}
        />
        {searchResults.length > 0 && (
          <ul className="team-search-results">
            {searchResults.map((p) => (
              <li key={p.id}>
                <img src={p.image} alt="" />
                <span>{p.name}</span>
                <button onClick={() => addToTeam(p.id)}>Add</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {team.length === 0 ? (
        <p className="team-empty-state">Add a Pokémon to see your team's strengths and weaknesses.</p>
      ) : (
        <div className="team-analysis">
          <section>
            <h2>Weakness Exposure</h2>
            {weaknessCounts.length === 0 ? (
              <p className="no-evolution">No shared weaknesses across your team.</p>
            ) : (
              <ul className="weakness-list">
                {weaknessCounts.map((w) => (
                  <li key={w.type}>
                    <TypeBadge type={w.type} />
                    <span className="weakness-count">{w.count} of {team.length}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Offensive Coverage</h2>
            <div className="type-badge-row">
              {ALL_TYPES.map((t) => (
                <span key={t} className={coverage.has(t) ? undefined : 'type-badge-muted'}>
                  <TypeBadge type={t} />
                </span>
              ))}
            </div>
            {gapTypes.length > 0 && (
              <p className="coverage-gap">No one on your team is strong against: {gapTypes.join(', ')}</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
