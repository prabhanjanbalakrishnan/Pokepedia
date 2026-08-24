import { TYPE_COLORS } from '../typeColors'

export default function TypeBadge({ type, multiplier }) {
  return (
    <span className="type-badge" style={{ backgroundColor: TYPE_COLORS[type] || '#777' }}>
      {type}{multiplier ? ` ×${multiplier}` : ''}
    </span>
  )
}
