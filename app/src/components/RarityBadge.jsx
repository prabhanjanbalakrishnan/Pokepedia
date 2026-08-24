export default function RarityBadge({ rarity }) {
  return <span className={`rarity-badge rarity-${rarity.toLowerCase()}`}>{rarity}</span>
}
