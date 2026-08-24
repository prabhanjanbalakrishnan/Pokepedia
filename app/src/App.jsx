import { useEffect, useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './components/Home'
import PokemonDetail from './components/PokemonDetail'
import TeamBuilder from './components/TeamBuilder'
import './App.css'

function App() {
  const [pokemonList, setPokemonList] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/data/pokemon.json')
      .then((res) => res.json())
      .then(setPokemonList)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="status-message">Failed to load Pokémon data: {error}</p>
  if (!pokemonList) return <p className="status-message">Loading Pokédex...</p>

  return (
    <>
      <nav className="top-nav">
        <div className="top-nav-links">
          <NavLink to="/" end className="top-nav-brand">Pokepedia</NavLink>
          <NavLink to="/team" className={({ isActive }) => isActive ? 'top-nav-link active' : 'top-nav-link'}>
            Team Builder
          </NavLink>
        </div>
        <span className="top-nav-tagline">GEN I–VII · 801 ENTRIES</span>
      </nav>
      <Routes>
        <Route path="/" element={<Home pokemonList={pokemonList} />} />
        <Route path="/pokemon/:id" element={<PokemonDetail pokemonList={pokemonList} />} />
        <Route path="/team" element={<TeamBuilder pokemonList={pokemonList} />} />
      </Routes>
    </>
  )
}

export default App
