-- =============================================================
-- Pokepedia Analysis: questions and answers
-- Run after 01_schema.sql and 02_load.sql. Each query is
-- independent; the expected result is in the comments below it.
-- =============================================================


-- -------------------------------------------------------------
-- Q1. How many Pokemon are single-type vs. dual-type?
-- Answer: 391 single-type (49%) and 410 dual-type (51%).
-- Technique: two-level aggregation (count types per Pokemon,
-- then count how many Pokemon have each type count).
-- -------------------------------------------------------------
SELECT type_count, COUNT(*) AS pokemon_count
FROM (
    SELECT pokedex_number, COUNT(*) AS type_count
    FROM pokemon_types
    GROUP BY pokedex_number
) x
GROUP BY type_count;
-- 1 | 391
-- 2 | 410


-- -------------------------------------------------------------
-- Q2. Which primary type has the highest average base stat total?
-- Answer: Dragon (522.8, 27 Pokemon), well ahead of Steel (491.6).
-- Bug is lowest (380.4).
-- Technique: chained JOINs, GROUP BY, AVG of a calculated column,
-- COUNT alongside the average as a sample-size check.
-- -------------------------------------------------------------
SELECT
    t.type_name,
    COUNT(*) AS pokemon_count,
    ROUND(AVG(s.hp + s.attack + s.defense + s.sp_attack + s.sp_defense + s.speed), 1) AS average_base_stat_total
FROM pokemon_types pt
JOIN stats s ON pt.pokedex_number = s.pokedex_number
JOIN types t ON t.type_id = pt.type_id
WHERE pt.slot = 1
GROUP BY t.type_name
ORDER BY average_base_stat_total DESC;
-- dragon | 27 | 522.8   (top)
-- steel  | 24 | 491.6
-- ...
-- bug    | 72 | 380.4   (bottom)


-- -------------------------------------------------------------
-- Q3. How do legendaries compare to non-legendaries on each stat?
-- Answer: legendaries are stronger on every stat, about 50% stronger
-- overall (615.3 vs. 410.5). Biggest gap: Special Attack (+46.6).
-- Smallest: Defense (+28.9) and HP (+29.0).
-- -------------------------------------------------------------

-- Q3a. Side by side: one row per group (GROUP BY)
SELECT
    p.is_legendary,
    COUNT(*) AS pokemon_count,
    ROUND(AVG(s.hp), 1) AS avg_hp,
    ROUND(AVG(s.attack), 1) AS avg_attack,
    ROUND(AVG(s.defense), 1) AS avg_defense,
    ROUND(AVG(s.sp_attack), 1) AS avg_sp_attack,
    ROUND(AVG(s.sp_defense), 1) AS avg_sp_defense,
    ROUND(AVG(s.speed), 1) AS avg_speed,
    ROUND(AVG(s.hp + s.attack + s.defense + s.sp_attack + s.sp_defense + s.speed), 1) AS avg_base_stat_total
FROM pokemon p
JOIN stats s ON p.pokedex_number = s.pokedex_number
GROUP BY p.is_legendary;
-- 0 | 731 | 66.4 |  74.8 | 70.5 |  67.2 |  67.9 | 63.5 | 410.5
-- 1 |  70 | 95.4 | 109.4 | 99.4 | 113.8 | 101.9 | 95.4 | 615.3

-- Q3b. The gaps on one row (conditional aggregation: AVG(CASE WHEN ...)).
-- No ELSE, so non-matching rows return NULL and AVG skips them,
-- the same idea as Excel's AVERAGEIF.
SELECT
    ROUND(AVG(CASE WHEN p.is_legendary = 1 THEN s.hp END) - AVG(CASE WHEN p.is_legendary = 0 THEN s.hp END), 1) AS hp_gap,
    ROUND(AVG(CASE WHEN p.is_legendary = 1 THEN s.attack END) - AVG(CASE WHEN p.is_legendary = 0 THEN s.attack END), 1) AS attack_gap,
    ROUND(AVG(CASE WHEN p.is_legendary = 1 THEN s.defense END) - AVG(CASE WHEN p.is_legendary = 0 THEN s.defense END), 1) AS defense_gap,
    ROUND(AVG(CASE WHEN p.is_legendary = 1 THEN s.sp_attack END) - AVG(CASE WHEN p.is_legendary = 0 THEN s.sp_attack END), 1) AS sp_attack_gap,
    ROUND(AVG(CASE WHEN p.is_legendary = 1 THEN s.sp_defense END) - AVG(CASE WHEN p.is_legendary = 0 THEN s.sp_defense END), 1) AS sp_defense_gap,
    ROUND(AVG(CASE WHEN p.is_legendary = 1 THEN s.speed END) - AVG(CASE WHEN p.is_legendary = 0 THEN s.speed END), 1) AS speed_gap,
    ROUND(AVG(CASE WHEN p.is_legendary = 1 THEN s.hp + s.attack + s.defense + s.sp_attack + s.sp_defense + s.speed END)
        - AVG(CASE WHEN p.is_legendary = 0 THEN s.hp + s.attack + s.defense + s.sp_attack + s.sp_defense + s.speed END), 1) AS avg_base_stat_total_gap
FROM pokemon p
JOIN stats s ON p.pokedex_number = s.pokedex_number;
-- 29.0 | 34.5 | 28.9 | 46.5 | 33.9 | 31.9 | 204.8
-- 204.8 = 615.3 - 410.5 from Q3a, so both methods agree.


-- -------------------------------------------------------------
-- Q4. Who's the strongest Pokemon in each generation?
-- Answer: 8 winners across 7 generations. Six generations are
-- topped by a legendary; Gen 2 by Tyranitar (non-legendary, total
-- includes Mega stats). Gen 7 is a tie: Solgaleo and Lunala, 680.
-- Technique: RANK() OVER (PARTITION BY ...) in a subquery, then
-- filter outside (window results can't be used in WHERE directly).
-- -------------------------------------------------------------
SELECT *
FROM (
    SELECT
        p.name,
        p.generation,
        s.hp + s.attack + s.defense + s.sp_attack + s.sp_defense + s.speed AS total,
        RANK() OVER (
            PARTITION BY p.generation
            ORDER BY s.hp + s.attack + s.defense + s.sp_attack + s.sp_defense + s.speed DESC
        ) AS gen_rank
    FROM pokemon p
    JOIN stats s ON p.pokedex_number = s.pokedex_number
) ranked
WHERE gen_rank = 1
ORDER BY generation;
-- Mewtwo    | 1 | 780 | 1
-- Tyranitar | 2 | 700 | 1
-- Rayquaza  | 3 | 780 | 1
-- Arceus    | 4 | 720 | 1
-- Kyurem    | 5 | 700 | 1
-- Zygarde   | 6 | 708 | 1
-- Solgaleo  | 7 | 680 | 1
-- Lunala    | 7 | 680 | 1


-- -------------------------------------------------------------
-- Q5. Which Pokemon have stats far above their type's average?
-- Answer: Groudon (+343.9) and Kyogre (+343.2) lead. Rayquaza ties
-- for the highest raw total (780) but ranks only 7th, because dragon
-- has the highest type average: raw numbers need the right baseline.
-- Technique: CTE + window AVG() OVER (PARTITION BY ...), which keeps
-- every row and adds the group average beside it.
-- -------------------------------------------------------------
WITH type_compare AS (
    SELECT
        p.name,
        t.type_name,
        s.hp + s.attack + s.defense + s.sp_attack + s.sp_defense + s.speed AS total,
        ROUND(AVG(s.hp + s.attack + s.defense + s.sp_attack + s.sp_defense + s.speed)
              OVER (PARTITION BY t.type_name), 1) AS type_avg
    FROM pokemon p
    JOIN pokemon_types pt ON p.pokedex_number = pt.pokedex_number
    JOIN types t ON pt.type_id = t.type_id
    JOIN stats s ON p.pokedex_number = s.pokedex_number
    WHERE slot = 1
)
SELECT name, type_name, total, type_avg,
       ROUND(total - type_avg, 1) AS above_type_avg
FROM type_compare
ORDER BY above_type_avg DESC
LIMIT 10;
-- Groudon   | ground  | 770 | 426.1 | 343.9
-- Kyogre    | water   | 770 | 426.8 | 343.2
-- Arceus    | normal  | 720 | 401.3 | 318.7
-- Mewtwo    | psychic | 780 | 461.3 | 318.7
-- Slaking   | normal  | 670 | 401.3 | 268.7
-- Regigigas | normal  | 670 | 401.3 | 268.7
-- Rayquaza  | dragon  | 780 | 522.8 | 257.2
-- Palkia    | water   | 680 | 426.8 | 253.2
-- Xerneas   | fairy   | 680 | 427.2 | 252.8
-- Tyranitar | rock    | 700 | 447.3 | 252.7


-- -------------------------------------------------------------
-- Q6. Which types have the most weaknesses (multiplier >= 2)?
-- Answer: rock (4.93) and grass (4.91) average almost 5 weaknesses
-- per Pokemon; electric (1.44) and normal (1.79) have the fewest.
-- Flying ranks 6th but on only 3 Pokemon (most list it as type 2).
-- Technique: two-level aggregation with a CTE (count per Pokemon,
-- then average per primary type). Note: attacking_type_id is the
-- type of the attack, so the Pokemon's own type comes from
-- pokemon_types.
-- -------------------------------------------------------------
WITH weakness_counts AS (
    SELECT
        pokedex_number,
        COUNT(*) AS weakness_count
    FROM type_matchups
    WHERE multiplier >= 2
    GROUP BY pokedex_number
)
SELECT
    type_name,
    ROUND(AVG(weakness_count), 2) AS avg_weaknesses,
    COUNT(*) AS pokemon_count
FROM weakness_counts wc
JOIN pokemon_types pt ON wc.pokedex_number = pt.pokedex_number
JOIN types t ON pt.type_id = t.type_id
WHERE pt.slot = 1
GROUP BY t.type_name
ORDER BY avg_weaknesses DESC;
-- rock     | 4.93 |  45
-- grass    | 4.91 |  78
-- ice      | 4.35 |  23
-- ground   | 3.84 |  32
-- bug      | 3.71 |  72
-- flying   | 3.67 |   3   <- tiny sample
-- ghost    | 3.63 |  27
-- dragon   | 3.63 |  27
-- dark     | 3.59 |  29
-- psychic  | 3.32 |  53
-- fire     | 3.19 |  52
-- fighting | 3.18 |  28
-- steel    | 3.17 |  24
-- poison   | 2.63 |  32
-- water    | 2.48 | 114
-- fairy    | 2.33 |  18
-- normal   | 1.79 | 105
-- electric | 1.44 |  39
