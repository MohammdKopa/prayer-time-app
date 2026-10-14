"""Tajweed colour data for the Quran reader.

    python scripts/build-tajweed.py

Input, in mobile/src/lib/quran/source/ (pinned by SHA-256 in tests/quran-tajweed.test.ts):

  cpfair-tajweed-hafs.json         tajweed annotations for riwayat Hafs, by
                                   Collin Fair (github.com/cpfair/quran-tajweed),
                                   CC BY 4.0. Character offsets into ...
  cpfair-tanzil-uthmani-2017.txt   ... this 2017 copy of the Tanzil Uthmani text,
                                   the one the annotations were computed on.
  tanzil-uthmani-1.1.txt           the text the app ships.

Tanzil has since changed the encoding, not the letters: a tatweel before every
superscript alif, the pause marks and sajda signs written with their own
spaces, hamza on a tatweel (U+0640 U+0654) where 2017 had a bare hamza
(U+0621), small yeh U+06E6 written as U+06E7, and in 12:39 and 12:41 the
superscript alif of يَـٰصَـٰحِبَىِ seated on a tatweel instead of an alif maqsura. So the offsets are
remapped by walking both texts side by side, and every remapped span is then
checked to cover the same letters as the original span, ignoring only those
encoding differences. Anything else unexpected stops the script.

The annotations are not re-derived from the newer text: the project's own
README warns that its classifier was tuned on the 2017 file.

Output: mobile/src/lib/quran/tajweed.ts
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "mobile/src/lib/quran/source"
OUT = ROOT / "mobile/src/lib/quran/tajweed.ts"

TATWEEL = "ـ"
# Characters the newer text has and the 2017 text does not: tatweel, the
# Quranic pause marks (small high sad-lam-alef ... small high three dots,
# small high meem, rub el hizb place) and the spaces written around them.
INSERTABLE = set(TATWEEL + " " + "۩" + "".join(chr(c) for c in range(0x06D6, 0x06DF)))
HAMZA = "ء"
HAMZA_ON_TATWEEL = TATWEEL + "ٔ"
SUPERSCRIPT_ALIF = "ٰ"
# One-for-one encoding changes: old character -> the character now in its place.
SAME_LETTER = {"ۦ": "ۧ"}


def read_ayat(name):
    lines = (SRC / name).read_text(encoding="utf-8").split("\n")
    out = {}
    for line in lines:
        if not line or line.startswith("#"):
            continue
        s, a, text = line.split("|", 2)
        out[(int(s), int(a))] = text
    return out


def align(old, new):
    """For each index in `old`, the [start, end) it occupies in `new`."""
    spans = []
    i = j = 0
    while i < len(old):
        if j < len(new) and old[i] == new[j]:
            spans.append((j, j + 1))
            i += 1
            j += 1
        elif j < len(new) and SAME_LETTER.get(old[i]) == new[j]:
            spans.append((j, j + 1))
            i += 1
            j += 1
        elif (
            old[i] == "ى"
            and old[i + 1 : i + 2] == SUPERSCRIPT_ALIF
            and new[j : j + 2] == TATWEEL + SUPERSCRIPT_ALIF
        ):
            # Seat of a superscript alif: alif maqsura in 2017, tatweel now.
            spans.append((j, j + 1))
            i += 1
            j += 1
        elif old[i] == HAMZA and new.startswith(HAMZA_ON_TATWEEL, j):
            spans.append((j, j + 2))
            i += 1
            j += 2
        elif j < len(new) and new[j] in INSERTABLE:
            j += 1
        else:
            raise ValueError(f"cannot align at old[{i}]={old[i]!r} new[{j}]={new[j:j+1]!r}")
    while j < len(new):
        if new[j] not in INSERTABLE:
            raise ValueError(f"trailing new text {new[j:]!r}")
        j += 1
    return spans


def fold(s):
    s = s.replace(HAMZA_ON_TATWEEL, HAMZA).replace("ى" + SUPERSCRIPT_ALIF, SUPERSCRIPT_ALIF)
    for a, b in SAME_LETTER.items():
        s = s.replace(a, b)
    return "".join(c for c in s if c not in INSERTABLE)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    old_ayat = read_ayat("cpfair-tanzil-uthmani-2017.txt")
    new_ayat = read_ayat("tanzil-uthmani-1.1.txt")
    data = json.loads((SRC / "cpfair-tajweed-hafs.json").read_text(encoding="utf-8"))
    data.sort(key=lambda d: (d["surah"], d["ayah"]))
    assert len(data) == 6236 == len(new_ayat)

    rules = sorted({a["rule"] for d in data for a in d["annotations"]})
    rule_id = {r: i for i, r in enumerate(rules)}

    rows = []
    total = 0
    for d in data:
        key = (d["surah"], d["ayah"])
        old, new = old_ayat[key], new_ayat[key]
        spans = align(old, new)
        flat = []
        for a in sorted(d["annotations"], key=lambda a: (a["start"], a["end"])):
            s, e = a["start"], a["end"]
            ns, ne = spans[s][0], spans[e - 1][1]
            # A tatweel the newer text inserted right before the span is the
            # stroke that carries its mark (the superscript alif of a madd):
            # colour it with the span.
            if ns > 0 and new[ns - 1] == TATWEEL and (s == 0 or spans[s - 1][1] < ns):
                ns -= 1
            if fold(new[ns:ne]) != fold(old[s:e]):
                raise ValueError(f"{key} {a['rule']}: {old[s:e]!r} -> {new[ns:ne]!r}")
            flat += [rule_id[a["rule"]], ns, ne]
            total += 1
        rows.append(flat)

    body = ",\n".join(json.dumps(r, separators=(",", ":")) for r in rows)
    OUT.write_text(
        "// GENERATED by scripts/build-tajweed.py. Do not edit.\n"
        "//\n"
        "// Tajweed annotations for riwayat Hafs by Collin Fair,\n"
        "// https://github.com/cpfair/quran-tajweed, licensed CC BY 4.0, remapped\n"
        "// from the 2017 Tanzil text they were computed on to the text in\n"
        "// ./text.ts. tests/quran-tajweed.test.ts checks every span.\n\n"
        f"export const TAJWEED_RULES = {json.dumps(rules)} as const;\n\n"
        "export type TajweedRule = (typeof TAJWEED_RULES)[number];\n\n"
        "/** Per āyah, in AYAT order: flat triples of [rule index, start, end),\n"
        " *  offsets in UTF-16 code units of the AYAT string. */\n"
        f"export const TAJWEED: readonly (readonly number[])[] = [\n{body}\n];\n",
        encoding="utf-8",
    )
    print(f"tajweed.ts: {total} spans over {len(rows)} āyāt, {len(rules)} rules")


if __name__ == "__main__":
    main()
