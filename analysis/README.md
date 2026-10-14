# Pokepedia: SQL Analysis

The same Pokémon dataset behind the Pokepedia app, modeled as a normalized relational database in SQLite and queried with SQL.

> **Status:** database built and verified; six analysis questions answered in [`04_analysis.sql`](./04_analysis.sql). Findings below.

## What this is

The source data (`../pokemon.csv`, 801 Pokémon, Generations I–VII) is one wide table: 41 columns, with lists packed into single cells and 18 near-identical type-effectiveness columns. This folder turns it into 7 clean, linked tables, with every cleaning decision written into the SQL and every load checked against an expected row count.

## Schema

| Table | Rows | One row per | Key |
|---|---|---|---|
| `pokemon` | 801 | Pokémon | `pokedex_number` |
| `stats` | 801 | Pokémon (the six battle stats) | `pokedex_number` → `pokemon` |
| `types` | 18 | type | `type_id` |
| `pokemon_types` | 1,211 | Pokémon × type (slot 1 or 2) | (`pokedex_number`, `slot`) |
| `abilities` | 227 | ability | `ability_id` |
| `pokemon_abilities` | 1,986 | Pokémon × ability (slots 1–6) | (`pokedex_number`, `slot`) |
| `type_matchups` | 14,418 | Pokémon × attacking type | (`pokedex_number`, `attacking_type_id`) |

`pokemon_types`, `pokemon_abilities` and `type_matchups` are link tables with composite primary keys and foreign keys to both sides, so a link to a Pokémon, type or ability that doesn't exist is rejected.

## Files

| File | What it does |
|---|---|
| [`01_schema.sql`](./01_schema.sql) | All `CREATE TABLE` statements, with types, `NOT NULL`, `CHECK`, `UNIQUE`, primary and foreign keys |
| [`02_load.sql`](./02_load.sql) | Loads every table from the raw import with `INSERT … SELECT`; all cleaning happens here |
| [`03_checks.sql`](./03_checks.sql) | Verification queries with the expected result for each |
| [`04_analysis.sql`](./04_analysis.sql) | Six analysis questions, each with its answer and expected output in comments |

## How to rebuild it

1. Open DB Browser for SQLite and create a new database (e.g. `pokepedia_analysis.db`).
2. Run `01_schema.sql`.
3. **File → Import → Table from CSV file**, choose `../pokemon.csv`, name the table `raw_pokemon`, tick *Column names in first line*, encoding UTF-8. DB Browser imports empty cells as `NULL`, which the load script relies on.
4. Run `02_load.sql`, then `03_checks.sql` and compare against the expected results in its comments.
5. Run any query in `04_analysis.sql`.

The `.db` file itself is not committed (see `.gitignore`); the scripts rebuild it from the CSV.

## Data cleaning decisions

The raw import (`raw_pokemon`) is never edited. Every fix lives in `02_load.sql`, so it is visible and repeatable.

| Issue in the source | How it was handled |
|---|---|
| `capture_rate` is text, and Minior's value is `30 (Meteorite)255 (Core)` | Cast to integer; Minior stored as 30, the rate for its Meteor form, which is the form a player encounters |
| `abilities` packs a list into one cell (`['Overgrow', 'Chlorophyll']`) | Converted to a JSON list with `REPLACE`, split into rows with `json_each`, then moved to `abilities` + `pokemon_abilities` |
| 18 `against_*` columns, one per attacking type | Unpivoted into rows with 18 `UNION ALL` branches → `type_matchups` |
| Column is `against_fight`, but the type is `fighting` | Labelled `'fighting'` in the unpivot; `'fight'` would match no type and silently drop 801 rows |
| 7 Pokémon repeat `type1` in `type2` (e.g. Raichu listed as electric/electric) | Treated as single-type: no slot-2 row. That gives 391 single-type and 410 dual-type Pokémon. `UNIQUE (pokedex_number, type_id)` on `pokemon_types` stops it from coming back |
| `type2` blank for single-type Pokémon | Stored as no slot-2 row rather than a NULL type |
| `percentage_male` blank for 98 Pokémon | Kept as `NULL`: these are genderless, not missing |
| `height_m` / `weight_kg` blank for 20 rows | Columns allow `NULL` |
| Column name `classfication` is misspelled | Renamed to `classification` in the clean table |
| `base_total` duplicates the six stats | Not stored. Checked first: it equals their sum in all 801 rows |

## Data quirks to know before analyzing

- **Some Pokémon carry Mega Evolution stats.** Venusaur's base total is 625, which is Mega Venusaur's (regular Venusaur is 525). The stats and the total agree with each other, so no consistency check catches it. Expect Mega forms near the top of any strength ranking.
- **Ability names follow the CSV's spelling**, e.g. `Lightningrod` rather than "Lightning Rod". The app counts ~224 abilities from PokeAPI; this dataset has 227.

## Findings

| # | Question | Answer | Technique |
|---|---|---|---|
| 1 | How many Pokémon are single-type vs. dual-type? | 391 single (49%), 410 dual (51%) | Two-level aggregation (subquery in `FROM`) |
| 2 | Which primary type has the highest average base stat total? | Dragon, 522.8 (27 Pokémon), ahead of Steel at 491.6; Bug lowest at 380.4 | Chained joins, `GROUP BY`, `AVG` |
| 3 | How do legendaries compare to non-legendaries on each stat? | Stronger on every stat, about 50% overall (615.3 vs 410.5); biggest gap Special Attack (+46.6) | `GROUP BY` and conditional aggregation (`AVG(CASE WHEN …)`) |
| 4 | Who's the strongest Pokémon in each generation? | 6 of 7 generations topped by a legendary; Gen 2 by Tyranitar; Gen 7 a tie (Solgaleo, Lunala, 680) | `RANK() OVER (PARTITION BY …)`, top-N per group |
| 5 | Which Pokémon are furthest above their type's average? | Groudon (+343.9) and Kyogre (+343.2); Rayquaza ties for the highest total but ranks 7th because Dragon's average is highest | CTE + window `AVG() OVER (PARTITION BY …)` |
| 6 | Which types have the most weaknesses (×2 or more)? | Rock (4.93) and Grass (4.91) per Pokémon; Electric (1.44) and Normal (1.79) fewest | Two-level aggregation with a CTE |

Two habits that shaped the answers:

- **Show the sample size next to every average.** Flying ranks 4th on stats (Q2) and 6th on weaknesses (Q6), but only 3 Pokémon are primary Flying, since most list it as their second type.
- **Compare against the right baseline.** A raw total says who is strong overall; the gap to the type average (Q5) says who stands out among similar Pokémon.

## Example query

Which Pokémon take 4× damage from rock? Before the unpivot this meant knowing which of 18 columns to check; now it is one `WHERE`:

```sql
SELECT p.name
FROM type_matchups tm
JOIN pokemon p ON p.pokedex_number = tm.pokedex_number
JOIN types t   ON t.type_id = tm.attacking_type_id
WHERE t.type_name = 'rock' AND tm.multiplier = 4;
-- 23 Pokémon: fire/flying (Charizard, Moltres, Ho-Oh…), bug/flying (Butterfree, Scyther…),
-- ice/flying (Articuno, Delibird) and bug/fire (Larvesta, Volcarona)
```

## Data source

[The Complete Pokemon Dataset](https://www.kaggle.com/datasets/rounakbanik/pokemon) by Rounak Banik on Kaggle, the same `pokemon.csv` used by the app.

## SQL concepts used

`CREATE TABLE` with `PRIMARY KEY`, composite keys, `FOREIGN KEY`, `UNIQUE`, `CHECK` (`IN`, `BETWEEN`) · `INSERT … SELECT` · `CASE` and `CAST` · `JOIN` (including on differently named columns, and chained joins) · `UNION` vs `UNION ALL` · subqueries in `FROM` · `json_each` and `REPLACE` for splitting packed text · `GROUP BY` with `COUNT` and `AVG` · conditional aggregation (`AVG(CASE WHEN …)`) · window functions (`RANK()`, `AVG() OVER (PARTITION BY …)`) · CTEs (`WITH`) · `typeof()` and `NULL` handling (`IS NULL` vs `=`)
