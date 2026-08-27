import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TypeBadge from './TypeBadge'
import { ALL_TYPES } from '../typeColors'

const STORAGE_KEY = 'pokepedia-team'
const MAX_TEAM_SIZE = 6
const DRAG_THRESHOLD = 8

function loadTeam() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    const ids = Array.isArray(parsed) ? parsed.slice(0, MAX_TEAM_SIZE) : []
    while (ids.length < MAX_TEAM_SIZE) ids.push(null)
    return ids.map((id) => (typeof id === 'number' ? id : null))
  } catch {
    return Array(MAX_TEAM_SIZE).fill(null)
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
  const navigate = useNavigate()
  const [teamIds, setTeamIds] = useState(loadTeam)
  const [activeSlot, setActiveSlot] = useState(null)
  const [search, setSearch] = useState('')
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const pickerRef = useRef(null)
  const dragRef = useRef({ index: null, overIndex: null, moved: false, startX: 0, startY: 0 })
  // Set on pointerup when a drag actually moved a slot, so the click event
  // that follows doesn't also navigate to the detail page - reset as soon
  // as that click is swallowed.
  const justDraggedRef = useRef(false)

  useEffect(() => {
    saveTeam(teamIds)
  }, [teamIds])

  useEffect(() => {
    if (activeSlot === null) return
    function closeIfOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setActiveSlot(null)
        setSearch('')
      }
    }
    function closeOnEscape(e) {
      if (e.key === 'Escape') {
        setActiveSlot(null)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', closeIfOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeIfOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeSlot])

  // Drag-to-reorder: pointer events (not native HTML5 DnD) so it works with
  // touch as well as mouse. Drag state lives in a ref so the document
  // listeners (registered once) always see the latest values; dragIndex/
  // dragOverIndex are mirrored into state only to drive the highlight
  // classNames.
  useEffect(() => {
    function onMove(e) {
      const d = dragRef.current
      if (d.index === null) return
      if (!d.moved) {
        if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return
        d.moved = true
        setDragIndex(d.index)
      }
      e.preventDefault()
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const slotEl = el ? el.closest('[data-slot-index]') : null
      const overIndex = slotEl ? Number(slotEl.dataset.slotIndex) : null
      if (overIndex !== d.overIndex) {
        d.overIndex = overIndex
        setDragOverIndex(overIndex)
      }
    }
    function onUp() {
      const d = dragRef.current
      if (d.moved) {
        justDraggedRef.current = true
        if (d.overIndex !== null && d.overIndex !== d.index) {
          swapSlots(d.index, d.overIndex)
        }
      }
      dragRef.current = { index: null, overIndex: null, moved: false, startX: 0, startY: 0 }
      setDragIndex(null)
      setDragOverIndex(null)
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const byId = useMemo(() => new Map(pokemonList.map((p) => [p.id, p])), [pokemonList])
  const team = teamIds.map((id) => (id ? byId.get(id) : null))
  const filledCount = team.filter(Boolean).length

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return pokemonList
      .filter((p) => p.name.toLowerCase().includes(q) && !teamIds.includes(p.id))
      .slice(0, 8)
  }, [search, pokemonList, teamIds])

  function toggleSlot(index) {
    setActiveSlot((current) => (current === index ? null : index))
    setSearch('')
  }

  function fillSlot(index, id) {
    setTeamIds((prev) => prev.map((existing, i) => (i === index ? id : existing)))
    setActiveSlot(null)
    setSearch('')
  }

  function removeFromSlot(index) {
    setTeamIds((prev) => prev.map((existing, i) => (i === index ? null : existing)))
  }

  function swapSlots(a, b) {
    setTeamIds((prev) => {
      const next = [...prev]
      ;[next[a], next[b]] = [next[b], next[a]]
      return next
    })
  }

  function startDrag(index) {
    return (e) => {
      if (e.target.closest('.team-slot-remove')) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      dragRef.current = { index, overIndex: null, moved: false, startX: e.clientX, startY: e.clientY }
    }
  }

  const weaknessCounts = useMemo(() => {
    const counts = new Map()
    for (const p of team) {
      if (!p) continue
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
      if (!p) continue
      for (const s of p.strengths) covered.add(s.type)
    }
    return covered
  }, [team])

  const gapTypes = ALL_TYPES.filter((t) => !coverage.has(t))

  return (
    <div className="team-page">
      <h1>Team Builder</h1>
      <p className="team-subtitle">Tap an empty slot to add a Pokémon, or drag a slot to reorder your team.</p>

      <div className="team-roster">
        {team.map((p, i) => {
          const slotClasses = ['team-slot']
          if (!p) slotClasses.push('empty')
          if (i === dragIndex) slotClasses.push('dragging')
          if (i === dragOverIndex && i !== dragIndex) slotClasses.push('drag-over')

          if (p) {
            return (
              <div
                key={p.id}
                className={slotClasses.join(' ')}
                data-slot-index={i}
                onPointerDown={startDrag(i)}
                onClick={() => {
                  if (justDraggedRef.current) {
                    justDraggedRef.current = false
                    return
                  }
                  navigate(`/pokemon/${p.id}`)
                }}
              >
                <button
                  className="team-slot-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromSlot(i)
                  }}
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
          }

          const isActive = activeSlot === i
          if (isActive) slotClasses.push('active')
          return (
            <div
              key={`empty-${i}`}
              className={slotClasses.join(' ')}
              data-slot-index={i}
              ref={isActive ? pickerRef : undefined}
            >
              {isActive ? (
                <>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="team-slot-search"
                  />
                  {searchResults.length > 0 && (
                    <ul className="team-slot-results">
                      {searchResults.map((result) => (
                        <li key={result.id}>
                          <button onClick={() => fillSlot(i, result.id)}>
                            <img src={result.image} alt="" />
                            <span>{result.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <button className="team-slot-add" onClick={() => toggleSlot(i)}>
                  <span className="team-slot-add-icon">+</span>
                  Add Pokémon
                </button>
              )}
            </div>
          )
        })}
      </div>

      {filledCount === 0 ? (
        <p className="team-empty-state">Tap an empty slot above to start building your team.</p>
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
                    <span className="weakness-count">{w.count} of {filledCount}</span>
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
