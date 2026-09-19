#!/usr/bin/env python3
"""Generate the Overture layer of the mobile mosque locator.

    python scripts/fetch-mosques-overture.py            # query Overture (≈20 min)
    python scripts/fetch-mosques-overture.py --from-raw raw.json   # re-shape a saved query

Overture Maps (overturemaps.org) publishes an open places dataset under the
CDLA-Permissive 2.0 licence, built from Meta, Microsoft, Foursquare and
TomTom. Its mosque category is fed largely by Facebook pages, which is
where the small Arab and Turkish mosques OpenStreetMap never mapped tend to
exist. This script pulls every place categorised `mosque` inside Germany
straight from Overture's public bucket with DuckDB, keeps the confident
ones, drops what OpenStreetMap already has (same building within
MATCH_RADIUS_M), collapses Facebook duplicates (same building within
SELF_RADIUS_M), and writes the rest to mobile/src/lib/mosques/overture.json.

Build-time on purpose: the app ships the result and makes no network
request of its own, which keeps the privacy policy true. Bulk use is what
the CDLA-Permissive licence is for — unlike a private API or Google Places,
this is data published to be redistributed.

Requires: pip install duckdb
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OSM = ROOT / "mobile" / "src" / "lib" / "mosques" / "germany.json"
OUT = ROOT / "mobile" / "src" / "lib" / "mosques" / "overture.json"

RELEASE = "2026-08-19.0"
BUCKET = "s3://overturemaps-us-west-2/release"

# Below this Overture's own confidence score means "probably stale or wrong".
MIN_CONFIDENCE = 0.5
# Same building as an OSM mosque → OSM wins (it has the better outline/name).
MATCH_RADIUS_M = 150
# Two Overture rows this close are one mosque with two Facebook pages.
SELF_RADIUS_M = 40

DE_BBOX = dict(w=5.8, e=15.1, s=47.2, n=55.1)


def query_overture() -> list[dict]:
    import duckdb  # local import: only the live path needs it

    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial;")
    con.execute("SET s3_region='us-west-2'; SET s3_access_key_id=''; SET s3_secret_access_key='';")
    sql = f"""
    SELECT id,
           names.primary AS name,
           categories.primary AS category,
           ST_Y(geometry) AS lat, ST_X(geometry) AS lng,
           addresses[1].freeform AS street,
           addresses[1].locality AS city,
           addresses[1].postcode AS postcode,
           addresses[1].country AS country,
           confidence
    FROM read_parquet('{BUCKET}/{RELEASE}/theme=places/type=place/*', hive_partitioning=1)
    WHERE bbox.xmin >= {DE_BBOX['w']} AND bbox.xmax <= {DE_BBOX['e']}
      AND bbox.ymin >= {DE_BBOX['s']} AND bbox.ymax <= {DE_BBOX['n']}
      AND categories.primary = 'mosque'
    """
    t0 = time.time()
    rows = con.execute(sql).fetchall()
    cols = [d[0] for d in con.description]
    print(f"Overture {RELEASE}: {len(rows)} mosque rows in {time.time() - t0:.0f}s")
    return [dict(zip(cols, r)) for r in rows]


def haversine_m(a_lat, a_lng, b_lat, b_lng) -> float:
    rad = math.radians
    d_lat = rad(b_lat - a_lat)
    d_lng = rad(b_lng - a_lng)
    s = math.sin(d_lat / 2) ** 2 + math.cos(rad(a_lat)) * math.cos(rad(b_lat)) * math.sin(d_lng / 2) ** 2
    return 2 * 6_371_000 * math.asin(math.sqrt(s))


def clean_name(name: str | None) -> str | None:
    if not name:
        return None
    n = re.sub(r"\s+", " ", name).strip()
    return n or None


def shape(raw: list[dict]) -> tuple[list[dict], dict]:
    osm = json.loads(OSM.read_text(encoding="utf-8"))
    stats = dict(total=len(raw), not_de=0, low_conf=0, no_name=0, in_osm=0, self_dup=0, kept=0)

    candidates = []
    for r in raw:
        if r.get("category") != "mosque":
            continue
        if (r.get("country") or "DE") != "DE":
            stats["not_de"] += 1
            continue
        conf = r.get("confidence")
        if conf is None or conf < MIN_CONFIDENCE:
            stats["low_conf"] += 1
            continue
        name = clean_name(r.get("name"))
        if not name:
            stats["no_name"] += 1
            continue
        lat, lng = float(r["lat"]), float(r["lng"])
        if not (DE_BBOX["s"] <= lat <= DE_BBOX["n"] and DE_BBOX["w"] <= lng <= DE_BBOX["e"]):
            stats["not_de"] += 1
            continue
        candidates.append(dict(r, name=name, lat=lat, lng=lng, confidence=conf))

    # Most confident first, so a duplicate pair keeps its better page.
    candidates.sort(key=lambda r: -r["confidence"])

    kept: list[dict] = []
    for r in candidates:
        if any(haversine_m(m["lat"], m["lng"], r["lat"], r["lng"]) <= MATCH_RADIUS_M for m in osm):
            stats["in_osm"] += 1
            continue
        if any(haversine_m(k["lat"], k["lng"], r["lat"], r["lng"]) <= SELF_RADIUS_M for k in kept):
            stats["self_dup"] += 1
            continue
        kept.append(r)

    out = []
    for r in kept:
        entry = {
            "id": f"overture-{r['id']}",
            "name": r["name"],
            "lat": round(r["lat"], 4),
            "lng": round(r["lng"], 4),
            "city": clean_name(r.get("city")),
        }
        street = clean_name(r.get("street"))
        if street:
            entry["street"] = street
        out.append(entry)
    out.sort(key=lambda e: e["id"])
    stats["kept"] = len(out)
    return out, stats


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-raw", help="shape a previously saved raw query instead of querying")
    ap.add_argument("--save-raw", help="save the raw query result here for --from-raw later")
    args = ap.parse_args()

    if args.from_raw:
        raw = json.loads(Path(args.from_raw).read_text(encoding="utf-8"))
        print(f"Loaded {len(raw)} raw rows from {args.from_raw}")
    else:
        raw = query_overture()
        if args.save_raw:
            Path(args.save_raw).write_text(json.dumps(raw, ensure_ascii=False, default=str), encoding="utf-8")

    out, stats = shape(raw)
    OUT.write_text(json.dumps(out, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(out)} mosques -> {OUT}")
    print("  " + ", ".join(f"{k}={v}" for k, v in stats.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
