import { Link } from 'react-router-dom'

function EvolutionNode({ stage, knownIds, nameById }) {
  const isLinkable = knownIds.has(stage.id)
  const displayName = nameById.get(stage.id) ?? stage.name
  const content = (
    <>
      <img src={stage.image} alt={displayName} />
      <span>{displayName}</span>
    </>
  )

  return (
    <div className="evolution-node">
      {isLinkable ? (
        <Link to={`/pokemon/${stage.id}`} className="evolution-node-link">
          {content}
        </Link>
      ) : (
        <div className="evolution-node-link">{content}</div>
      )}
    </div>
  )
}

function EvolutionBranch({ stage, knownIds, nameById }) {
  return (
    <div className="evolution-branch">
      <EvolutionNode stage={stage} knownIds={knownIds} nameById={nameById} />
      {stage.evolvesTo.length > 0 && (
        <>
          <span className="evolution-arrow">→</span>
          <div className="evolution-children">
            {stage.evolvesTo.map((child) => (
              <EvolutionBranch key={child.id} stage={child} knownIds={knownIds} nameById={nameById} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function EvolutionChain({ chain, knownIds, nameById }) {
  const isSingleStage = chain.evolvesTo.length === 0
  if (isSingleStage) {
    return <p className="no-evolution">This Pokémon does not evolve.</p>
  }
  return (
    <div className="evolution-chain">
      <EvolutionBranch stage={chain} knownIds={knownIds} nameById={nameById} />
    </div>
  )
}
