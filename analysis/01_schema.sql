-- =============================================================
-- Pokepedia Analysis: schema
-- SQLite. Builds 7 clean tables from the raw_pokemon staging table
-- (see 02_load.sql for how raw_pokemon is imported and loaded).
-- =============================================================

-- Foreign keys are off by default in SQLite and apply per connection.
PRAGMA foreign_keys = ON;

-- One row per Pokémon: identity, size and breeding info.
CREATE TABLE pokemon (
    pokedex_number INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    japanese_name TEXT NOT NULL,
    classification TEXT NOT NULL,
    generation INTEGER NOT NULL,
    is_legendary INTEGER NOT NULL CHECK (is_legendary IN (0, 1)),
    height_m REAL,          -- 20 blanks in the source
    weight_kg REAL,         -- 20 blanks in the source
    capture_rate INTEGER NOT NULL,
    base_happiness INTEGER NOT NULL,
    base_egg_steps INTEGER NOT NULL,
    experience_growth INTEGER NOT NULL,
    percentage_male REAL    -- NULL = genderless (98 Pokémon), not missing data
);

-- The six battle stats; one row per Pokémon.
-- base_total is not stored: it is the sum of the six and is calculated in queries.
CREATE TABLE stats (
    pokedex_number INTEGER PRIMARY KEY,
    hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    sp_attack INTEGER NOT NULL,
    sp_defense INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    FOREIGN KEY (pokedex_number) REFERENCES pokemon(pokedex_number)
);

-- Lookup table: the 18 types.
CREATE TABLE types (
    type_id INTEGER PRIMARY KEY,
    type_name TEXT NOT NULL UNIQUE
);

-- Link table: one row per Pokémon per type (slot 1 = primary, slot 2 = secondary).
CREATE TABLE pokemon_types (
    pokedex_number INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    slot INTEGER NOT NULL CHECK (slot IN (1, 2)),
    PRIMARY KEY (pokedex_number, slot),
    -- the same type can't appear in both slots (blocks the electric/electric duplicates)
    UNIQUE (pokedex_number, type_id),
    FOREIGN KEY (pokedex_number) REFERENCES pokemon(pokedex_number),
    FOREIGN KEY (type_id) REFERENCES types(type_id)
);

-- Lookup table: the 227 abilities in the source data.
CREATE TABLE abilities (
    ability_id INTEGER PRIMARY KEY,
    ability_name TEXT NOT NULL UNIQUE
);

-- Link table: one row per Pokémon per ability (up to 6 per Pokémon).
CREATE TABLE pokemon_abilities (
    pokedex_number INTEGER NOT NULL,
    ability_id INTEGER NOT NULL,
    slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 6),
    PRIMARY KEY (pokedex_number, slot),
    FOREIGN KEY (pokedex_number) REFERENCES pokemon(pokedex_number),
    FOREIGN KEY (ability_id) REFERENCES abilities(ability_id)
);

-- Damage multiplier each attacking type deals to each Pokémon
-- (unpivoted from the 18 against_* columns).
CREATE TABLE type_matchups (
    pokedex_number INTEGER NOT NULL,
    attacking_type_id INTEGER NOT NULL,
    multiplier REAL NOT NULL CHECK (multiplier IN (0, 0.25, 0.5, 1, 2, 4)),
    PRIMARY KEY (pokedex_number, attacking_type_id),
    FOREIGN KEY (pokedex_number) REFERENCES pokemon(pokedex_number),
    FOREIGN KEY (attacking_type_id) REFERENCES types(type_id)
);
