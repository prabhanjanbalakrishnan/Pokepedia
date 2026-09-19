import { useState } from 'react'

// Shown on hover (desktop) OR tap (touch, where hover doesn't fire) - the
// two states are tracked separately so a click always toggles regardless of
// whether the badge happens to already be hovered.
export default function AbilityBadge({ ability }) {
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const visible = (hovered || pinned) && ability.description

  return (
    <span
      className="ability-badge-wrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="ability-badge"
        onClick={() => setPinned((p) => !p)}
        aria-expanded={visible}
      >
        {ability.name}
        {ability.hidden && <span className="ability-hidden-tag"> (Hidden)</span>}
      </button>
      {visible && (
        <span className="ability-tooltip" role="tooltip">
          {ability.description}
        </span>
      )}
    </span>
  )
}
