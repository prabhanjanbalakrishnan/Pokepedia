"""
Builds a single self-contained HTML file (no external requests) for sharing
the Pokedex as a link. Embeds small sprite images as base64 so it works
without internet access or a server. Not part of the normal dev app - this
is only for the "share with friends" artifact.

Usage: python3 build_artifact.py
"""

import base64
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
CACHE_DIR = SCRIPT_DIR / "cache" / "sprites"
POKEMON_JSON = SCRIPT_DIR.parent / "public" / "data" / "pokemon.json"
OUTPUT_JSON = SCRIPT_DIR / "artifact_data.json"

SPRITE_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png"


def fetch_sprite_b64(pid):
    cache_path = CACHE_DIR / f"{pid}.png"
    if not cache_path.exists():
        request = urllib.request.Request(
            SPRITE_URL.format(id=pid), headers={"User-Agent": "Mozilla/5.0"}
        )
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=15) as resp:
                    cache_path.write_bytes(resp.read())
                break
            except (urllib.error.URLError, TimeoutError):
                if attempt == 2:
                    raise
                time.sleep(1.5 * (attempt + 1))
    return base64.b64encode(cache_path.read_bytes()).decode("ascii")


def collect_ids(pokemon_list):
    ids = set()

    def walk(node):
        ids.add(node["id"])
        for child in node["evolvesTo"]:
            walk(child)

    for p in pokemon_list:
        ids.add(p["id"])
        walk(p["evolutionChain"])
    return ids


def build():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    pokemon_list = json.loads(POKEMON_JSON.read_text())
    ids = sorted(collect_ids(pokemon_list))

    print(f"Fetching {len(ids)} sprites...")
    images = {}
    for i, pid in enumerate(ids, start=1):
        print(f"[{i}/{len(ids)}] #{pid}", end="\r")
        images[pid] = fetch_sprite_b64(pid)
    print()

    # Strip the (now redundant) per-node image URLs - the page looks images
    # up by id from the shared `images` map instead, to avoid repeating
    # base64 data for species that appear in both the main list and chains.
    def strip_images(node):
        node.pop("image", None)
        for child in node["evolvesTo"]:
            strip_images(child)

    for p in pokemon_list:
        p.pop("image", None)
        strip_images(p["evolutionChain"])

    output = {"pokemon": pokemon_list, "images": images}
    OUTPUT_JSON.write_text(json.dumps(output))
    size_mb = OUTPUT_JSON.stat().st_size / (1024 * 1024)
    print(f"Wrote {OUTPUT_JSON} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    build()
