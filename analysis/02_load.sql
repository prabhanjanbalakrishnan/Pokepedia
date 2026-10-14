-- =============================================================
-- Pokepedia Analysis: load
-- Run after 01_schema.sql.
--
-- Step 0 (done outside SQL): import ../pokemon.csv as a table named
-- raw_pokemon. In DB Browser for SQLite: File > Import > Table from
-- CSV file, "Column names in first line" checked, UTF-8.
-- DB Browser imports empty cells as NULL, which this script relies on.
--
-- raw_pokemon is a staging copy and is never edited: every cleaning
-- step happens in the INSERT ... SELECT statements below.
-- =============================================================

PRAGMA foreign_keys = ON;

-- -------------------------------------------------------------
-- pokemon (801 rows)
-- -------------------------------------------------------------
INSERT INTO pokemon (
    pokedex_number, name, japanese_name, classification,
    generation, is_legendary, height_m, weight_kg,
    capture_rate, base_happiness, base_egg_steps,
    experience_growth, percentage_male)
SELECT
    pokedex_number, name, japanese_name,
    classfication,  -- the raw column name is misspelled
    generation, is_legendary, height_m, weight_kg,
    -- Minior's raw value is '30 (Meteorite)255 (Core)'; storing 30 (Meteor form, as encountered)
    CASE
        WHEN name = 'Minior' THEN 30
        ELSE CAST(capture_rate AS INTEGER)
    END,
    base_happiness, base_egg_steps, experience_growth, percentage_male
FROM raw_pokemon;

-- -------------------------------------------------------------
-- stats (801 rows)
-- -------------------------------------------------------------
INSERT INTO stats (pokedex_number, hp, attack, defense, sp_attack, sp_defense, speed)
SELECT pokedex_number, hp, attack, defense, sp_attack, sp_defense, speed
FROM raw_pokemon;

-- -------------------------------------------------------------
-- types (18 rows): every distinct name from both type columns
-- -------------------------------------------------------------
INSERT INTO types (type_name)
SELECT type1 FROM raw_pokemon
UNION
SELECT type2 FROM raw_pokemon
WHERE type2 IS NOT NULL;

-- -------------------------------------------------------------
-- pokemon_types (1,211 rows: 801 slot 1 + 410 slot 2)
-- -------------------------------------------------------------
-- Slot 1: every Pokémon's primary type
INSERT INTO pokemon_types (pokedex_number, type_id, slot)
SELECT r.pokedex_number, t.type_id, 1
FROM raw_pokemon r
JOIN types t ON t.type_name = r.type1;

-- Slot 2: secondary types. The JOIN skips NULL type2 on its own.
-- 7 rows repeat type1 in type2 (e.g. Raichu listed as electric/electric);
-- those are single-type Pokémon, so they get no slot-2 row.
INSERT INTO pokemon_types (pokedex_number, type_id, slot)
SELECT r.pokedex_number, t.type_id, 2
FROM raw_pokemon r
JOIN types t ON t.type_name = r.type2
WHERE r.type2 <> r.type1;

-- -------------------------------------------------------------
-- abilities (227 rows)
-- The abilities column holds text like ['Overgrow', 'Chlorophyll'].
-- Swapping single quotes (CHAR 39) for double quotes (CHAR 34) makes it
-- a JSON list, which json_each() splits into one row per ability.
-- -------------------------------------------------------------
INSERT INTO abilities (ability_name)
SELECT DISTINCT j.value
FROM raw_pokemon r,
     json_each(REPLACE(r.abilities, CHAR(39), CHAR(34))) j;

-- -------------------------------------------------------------
-- pokemon_abilities (1,986 rows)
-- Split each list, keep its position as the slot, look up each name's ID.
-- -------------------------------------------------------------
INSERT INTO pokemon_abilities (pokedex_number, ability_id, slot)
SELECT r.pokedex_number, a.ability_id, j.key + 1
FROM raw_pokemon r,
     json_each(REPLACE(r.abilities, CHAR(39), CHAR(34))) j
JOIN abilities a ON a.ability_name = j.value;

-- -------------------------------------------------------------
-- type_matchups (14,418 rows = 801 Pokémon x 18 attacking types)
-- Unpivot: one branch per against_* column, each labelled with its
-- type name, then swap the label for its type_id.
-- -------------------------------------------------------------
INSERT INTO type_matchups (pokedex_number, attacking_type_id, multiplier)
SELECT u.pokedex_number, t.type_id, u.multiplier
FROM (
    SELECT pokedex_number, 'bug' AS type_name, against_bug AS multiplier FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'dark', against_dark FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'dragon', against_dragon FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'electric', against_electric FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'fairy', against_fairy FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'fighting', against_fight FROM raw_pokemon  -- column is 'fight', type is 'fighting'
    UNION ALL SELECT pokedex_number, 'fire', against_fire FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'flying', against_flying FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'ghost', against_ghost FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'grass', against_grass FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'ground', against_ground FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'ice', against_ice FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'normal', against_normal FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'poison', against_poison FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'psychic', against_psychic FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'rock', against_rock FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'steel', against_steel FROM raw_pokemon
    UNION ALL SELECT pokedex_number, 'water', against_water FROM raw_pokemon
) u
JOIN types t ON t.type_name = u.type_name;
