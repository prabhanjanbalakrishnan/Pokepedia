# Pokepedia

A Pokémon reference app covering all 801 Pokémon from Generations I–VII — browse, filter, and build a team to test its type coverage.

**Live demo:** _coming soon_

## Features

- Browse and search all 801 Pokémon, with filters for type, region, generation, and rarity
- Each Pokémon's page shows its evolution chain (including branching families like Eevee's 8 evolutions), type strengths and weaknesses, and where it's found
- **Team Builder** — assemble a team of up to 6 Pokémon and see its collective weak points and offensive coverage gaps at a glance, saved locally between visits
- A [standalone offline version](./app/scripts/artifact_template.html) also exists as a single self-contained HTML file — everything (including all 801 sprites) embedded inline, no server or internet connection needed

## Tech stack

- **Frontend:** React, React Router, Vite
- **Data pipeline:** Python (openpyxl, pandas) merging a source spreadsheet with data fetched from [PokeAPI](https://pokeapi.co/)
- No backend — the built app is fully static, reading a single generated JSON file

## How it was built

The dataset started as a spreadsheet with base stats and type effectiveness data, but no images, evolution chains, or regions. A Python pipeline (`app/scripts/build_data.py`) enriches it: pulling artwork and evolution chain data from PokeAPI, mapping each Pokémon's generation to its home region, and computing two fields that don't exist anywhere in the source data —

- **Weaknesses**, from the spreadsheet's own defensive type-effectiveness columns.
- **Strengths** (what a Pokémon is offensively super-effective against), computed from a hardcoded type chart — cross-validated against the spreadsheet's defensive data across all 391 single-type Pokémon (7,038 matchups, zero mismatches) before being trusted.

The result is a single JSON file the React app reads once and filters entirely client-side.

## Running locally

```bash
cd app
npm install
npm run dev
```

Requires internet access — Pokémon artwork is loaded from PokeAPI's CDN at runtime.

To regenerate the data (only needed if the source spreadsheet changes):

```bash
python3 app/scripts/build_data.py
```

See [CLAUDE.md](./CLAUDE.md) for a deeper technical breakdown of the data pipeline and app architecture.
