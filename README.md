# Pokepedia

A full-stack Pokémon reference app covering all 801 Pokémon from Generations I–VII — browse, filter, and build a team to test its type coverage.

**🔗 Live demo: [pokepedia-ten.vercel.app](https://pokepedia-ten.vercel.app/)**

## What is this?

Pokepedia is a Pokédex-style web app built from scratch: a spreadsheet of raw Pokémon stats goes in, and a searchable, filterable reference site with rich per-Pokémon detail pages and a team-planning tool comes out. It's a personal project built to practice a full application stack end to end — a data pipeline, a React frontend, and a deployed production site — using a dataset (Pokémon) that made the results fun to explore rather than abstract.

## Features

- **Browse & filter** all 801 Pokémon by name, type, region, generation, and rarity
- **Detail pages** for every Pokémon: Japanese name, classification, height, weight, all six base stats (rendered as comparison bars), full evolution chains (including branching families like Eevee's 8 evolutions), and type strengths/weaknesses
- **Abilities** — every unique ability in the game (~224 of them) with its effect description, browsable and searchable on its own page, with links to every Pokémon that has it
- Hover or tap any ability badge on a Pokémon's page to see what it actually does — click a Pokémon's own **🔊 Cry** button to hear its in-game sound effect
- **Team Builder** — assemble a team of up to 6 Pokémon (drag to reorder, tap a teammate to jump to its profile) and see the team's collective weak points and offensive coverage gaps at a glance; saved locally between visits
- A [standalone offline version](./app/scripts/artifact_template.html) also exists as a single self-contained HTML file — everything (including all 801 sprites) embedded inline, no server or internet connection needed, for sharing the whole app as one file

## Tech stack

- **Frontend:** React 19, React Router, Vite
- **Data pipeline:** Python (`openpyxl` + the [PokeAPI](https://pokeapi.co/) REST API) merging a source spreadsheet with fetched artwork, evolution chains, abilities, and stats
- **Deployment:** Vercel (static build, auto-deployed from `main`)
- No backend — the built app is fully static, reading a single generated JSON file; all search/filtering happens client-side

## How it was built

The dataset started as a spreadsheet with base stats and type-effectiveness data, but no images, Japanese names, abilities, evolution chains, or regions. A Python pipeline (`app/scripts/build_data.py`) enriches every entry by merging in data fetched from PokeAPI — artwork, evolution chains, abilities and their descriptions, cries, and the remaining stats — and computes two fields that exist nowhere in the source data:

- **Weaknesses**, from the spreadsheet's own defensive type-effectiveness columns.
- **Strengths** (what a Pokémon is offensively super-effective against), computed from a hardcoded type chart — cross-validated against the spreadsheet's own defensive data across all 391 single-type Pokémon (7,038 matchups, zero mismatches) before being trusted.

API responses are cached to disk, so the pipeline only hits the network once per Pokémon/ability even across reruns. The result is a single JSON file the React app fetches once and filters entirely client-side — no backend, no database, no per-request API calls.

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

## License

The code in this repository is licensed under the [MIT License](./LICENSE). Pokémon, Pokémon character names, and associated imagery are trademarks and copyrights of Nintendo, Game Freak, and Creatures Inc. This is an unofficial, non-commercial fan project not affiliated with or endorsed by them.
