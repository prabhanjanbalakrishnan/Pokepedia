# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Pokémon reference web app. The repo root holds the original source data (`Pokemon Data.xlsx`, 801 Pokémon covering Gen 1–7, plus an equivalent `pokemon.csv` — both untouched, treated as read-only source of truth). The `app/` directory contains the actual React application and the one-time data pipeline that builds its dataset.

## Commands

All commands run from `app/`:

- `npm run dev` — start the Vite dev server (http://localhost:5173)
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — run oxlint

There is no test suite in this project.

Data pipeline (rerun only if `Pokemon Data.xlsx` changes, or the merge logic changes):

```bash
python3 app/scripts/build_data.py
```

Requires internet access (calls PokeAPI). Raw API responses are cached under `app/scripts/cache/` so reruns are fast and don't refetch — delete that directory to force a full refetch.

## Architecture

**Data flow:** `Pokemon Data.xlsx` → `app/scripts/build_data.py` merges the spreadsheet's per-Pokémon columns (`name`, `type1`/`type2`, `generation`, `is_legendary`) with data fetched from PokeAPI (official-artwork image URLs, evolution chains) → writes `app/public/data/pokemon.json` (801 entries). The React app fetches this JSON once on load in `App.jsx` and passes the full list down via props to both routes — there's no backend, no per-route refetching, and no client-side state management library.

**Fields not present in the source spreadsheet, and how they're derived** (see `build_data.py`):
- `region` — mapped from `generation` (Gen 1=Kanto ... Gen 7=Alola) via `GENERATION_TO_REGION`.
- `rarity` — `"Legendary"` if `is_legendary` is set, else `"Common"` (no separate "Rare" tier).
- `weaknesses` — derived from the spreadsheet's 18 `against_X` columns (damage multiplier taken from each attacking type). Only types with a multiplier > 1 are kept, sorted by multiplier descending. Note the column is `against_fight`, not `against_fighting` — see `AGAINST_COLUMN_TO_TYPE`.
- `strengths` — the reverse: types this Pokemon's own types are super effective against when attacking. The spreadsheet has no offensive data, so `build_data.py` hardcodes the standard Gen 6+ type chart (`TYPE_CHART`) and computes the union of what each of the Pokemon's types is 2x against (`compute_strengths`). Verified against every pure single-type Pokemon's own `against_X` values with 0 mismatches (7038 matchups) before trusting it — if the source data ever moves to a different generation's ruleset, re-run that same cross-check before reusing this chart.

**Data quirk:** some rows repeat `type1` in `type2` instead of leaving it blank for single-type Pokémon (e.g. Raichu is listed as electric/electric in the sheet). `types` is deduplicated when built — don't reintroduce a plain `[type1, type2]` filter without dedup, or badges/keys will double up.

**Images are not downloaded into the repo.** `pokemon.json` stores PokeAPI CDN URLs (`raw.githubusercontent.com/PokeAPI/sprites`, official-artwork), so the running app needs internet access to render images.

**Evolution chains** are normalized by `normalize_chain_link()` in `build_data.py` into a nested tree (`{ name, id, image, evolvesTo: [...] }`) so branching families (e.g. Eevee's 8 evolutions) are represented natively, not as a flat list. `EvolutionChain.jsx` renders this recursively. Chain members outside the dataset's ID range (1–801 — e.g. a Gen 8+ evolution like Sirfetch'd) are rendered as non-clickable nodes rather than broken links; see the `knownIds` check there.

**Routing** is `react-router-dom` with three routes defined in `App.jsx`: `/` (`Home.jsx` — grid with search/type/region/generation/rarity filters), `/pokemon/:id` (`PokemonDetail.jsx`), and `/team` (`TeamBuilder.jsx`). A small persistent top nav in `App.jsx` links between `/` and `/team`.

**Team builder** (`TeamBuilder.jsx`) lets a user pick up to 6 Pokémon and see the team's aggregate `weaknesses` (how many members are exposed to each attacking type) and `strengths` (union of types the team can hit super-effectively, with any type nobody covers called out as a gap). Pure client-side aggregation over the already-computed per-Pokémon fields — no pipeline changes needed. Team selection persists in `localStorage` (key `pokepedia-team`).

## Shareable standalone artifact

`app/scripts/build_artifact.py` builds a second, separate deliverable: a single self-contained HTML file (vanilla JS, no React, no build step) for sharing as a link outside this dev environment — e.g. a Claude Artifact. It mirrors the dev app's features (browsing, filters, detail pages, and the team builder) with its own hand-rolled hash router and DOM-building helper (`el()`) — there's no shared code between the two frontends, so a feature added to one has to be re-implemented in the other by hand. Unlike the dev app, it embeds every image as base64 (small in-game sprites, not the large official artwork — those are ~100–200KB each and would blow past the artifact size limit; sprites are ~500–900 bytes) so the page needs no internet access and no external image requests, which a sandboxed artifact page can't make anyway. Run order: `build_data.py` first (produces `public/data/pokemon.json`), then `build_artifact.py` (produces `scripts/artifact_data.json`, fetching/caching sprites under `scripts/cache/sprites/`). The final file is `scripts/artifact_template.html` with `__POKEMON_DATA__` replaced by the contents of `artifact_data.json` — this substitution has to be done manually (e.g. a one-off Python snippet) before publishing; there's no build script wired up for that last step.
