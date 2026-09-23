# Adhan recordings

Both files are mono 44.1 kHz Ogg Vorbis, trimmed of leading/trailing
silence and loudness-normalised to −16 LUFS with ffmpeg. They are registered
with the `expo-notifications` config plugin in `app.json` and end up in
`android/app/src/main/res/raw` at prebuild. Resource names must stay
`[a-z0-9_]`, so do not rename them with dashes or capitals.

| File | Source | Licence | Length |
|---|---|---|---|
| `adhan_full.ogg` | [Beautiful adhan.ogg](https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg) on Wikimedia Commons, own work by user Adam-synagda (2022) | CC0 1.0 (public domain dedication) | 2:33 |
| `adhan_short.ogg` | First 32 s of `adhan_full.ogg`, 3 s fade-out | CC0 1.0 | 0:32 |
| `ios_adhan.caf` | First 29 s of `adhan_full.ogg`, 3 s fade-out, mono IMA4 | CC0 1.0 | 0:29 |

`ios_adhan.caf` exists because iOS cannot play Ogg in a notification and
plays at most 30 s of one; a longer file falls back to the default sound.
Both recorded voices play it on iOS. Made with:

    ffmpeg -i adhan_full.ogg -t 29 -af "afade=t=out:st=26:d=3" -ar 44100 -ac 1 -c:a adpcm_ima_qt -f caf ios_adhan.caf

It has no `adhan_` prefix on purpose: the config plugin also copies it into
Android's res/raw, and the keep rule there covers `adhan_*` only, so the
resource shrinker removes it from Android builds.

## Removed

- `adhan_makkah_1885.ogg` — the 1885 Makkah wax-cylinder recording by
  Christiaan Snouck Hurgronje (public domain). Shipped in the first voice
  picker, dropped on 2026-09-19: a historical curiosity, not something to
  wake up to. Its notification channel `adhan-makkah1885` is deleted on the
  next channel setup (see `lib/adhan-voice.ts`, `RETIRED_CHANNELS`), and a
  stored choice of it falls back to the full adhan.

## Considered and rejected

- *Call to prayer by Sabah Fakhry.mp3* on Commons is tagged public domain, but
  the file page itself dates it 1985 and sources it from YouTube. A 1985
  commercial recording is not public domain; the tag is wrong. Not used.
- *The Adhan – Aaqib Azeez.mp3* is tagged CC BY-SA 4.0 by an uploader who is
  not the performer. Provenance unclear. Not used.
- *Azan.ogg* (CC BY-SA 4.0, own work by user Andrewler) is usable with
  attribution and share-alike on the normalised copy. Left out for now to keep
  the shipped set licence-free; it can be added as a third voice.
