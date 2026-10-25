-- =============================================================
-- Pokepedia Analysis: verification checks
-- Run after 02_load.sql. Expected results are in the comments.
-- =============================================================

-- Row counts for every table
SELECT 'pokemon' AS table_name, COUNT(*) AS row_count FROM pokemon            -- 801
UNION ALL SELECT 'stats', COUNT(*) FROM stats                                 -- 801
UNION ALL SELECT 'types', COUNT(*) FROM types                                 -- 18
UNION ALL SELECT 'pokemon_types', COUNT(*) FROM pokemon_types                 -- 1,211
UNION ALL SELECT 'abilities', COUNT(*) FROM abilities                         -- 227
UNION ALL SELECT 'pokemon_abilities', COUNT(*) FROM pokemon_abilities         -- 1,986
UNION ALL SELECT 'type_matchups', COUNT(*) FROM type_matchups;                -- 14,418

-- Blanks imported as true NULL, not empty text
SELECT COUNT(*) FROM raw_pokemon WHERE height_m IS NULL;   -- 20
SELECT COUNT(*) FROM raw_pokemon WHERE height_m = '';      -- 0
SELECT COUNT(*) FROM raw_pokemon WHERE type2 IS NULL;      -- 384

-- Minior's capture_rate was cleaned to 30
SELECT name, capture_rate FROM pokemon WHERE name = 'Minior';   -- Minior | 30

-- Every capture_rate is stored as an integer (SQLite does not enforce declared types)
SELECT typeof(capture_rate), COUNT(*)
FROM pokemon
GROUP BY typeof(capture_rate);                              -- integer | 801

-- base_total in the CSV always equals the sum of the six stats,
-- so it is safe to calculate it instead of storing it
SELECT COUNT(*)
FROM raw_pokemon
WHERE hp + attack + defense + sp_attack + sp_defense + speed <> base_total;   -- 0

-- Types per slot
SELECT slot, COUNT(*) FROM pokemon_types GROUP BY slot;   -- 1 | 801, 2 | 410

-- No Pokémon has the same type in both slots
SELECT COUNT(*)
FROM pokemon_types a
JOIN pokemon_types b
  ON b.pokedex_number = a.pokedex_number AND a.slot = 1 AND b.slot = 2
WHERE a.type_id = b.type_id;                              -- 0

-- Spot check: Pokémon that take 4x damage from rock (23 rows, incl. Charizard)
SELECT p.name
FROM type_matchups tm
JOIN pokemon p ON p.pokedex_number = tm.pokedex_number
JOIN types t   ON t.type_id = tm.attacking_type_id
WHERE t.type_name = 'rock' AND tm.multiplier = 4;
