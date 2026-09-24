# Photo credits — mosque display (mobile)

Downscaled copies (≤1920 px, q4) of `/public/photos` on the website; same photos, same credits. Update both when the set changes.

Full-screen photographs shown on the mosque display.

| File | Source | Licence |
|---|---|---|
| `aqsa.jpg` | ["Der Felsendom mitten in der Stadt"](https://unsplash.com/photos/oJMwapMuApk) by Thales Botelho de Sousa (@thalesbs) on Unsplash; source traced 2026-09-24 | [Unsplash License](https://unsplash.com/license) (commercial use allowed, attribution not required) |
| `makkah.jpg` | ["Aerial view of Mecca's Grand Mosque at night"](https://www.pexels.com/photo/aerial-view-of-mecca-s-grand-mosque-at-night-36954370/) by Arjan Carja on Pexels. 4000×3000, cropped to 16:9 anchored at the bottom (the Kaʿba sits low); no upscaling. Replaced the Pinterest image 2026-09-24 | [Pexels License](https://www.pexels.com/license/) (commercial use allowed, attribution not required) |
| `umayyad-damascus.jpg` | ["grau-braunes Domgebäude unter blauem Himmel"](https://unsplash.com/photos/coPHmh0kikU) by T Foz (@tfoz74) on Unsplash: the courtyard, prayer hall and Minaret of the Bride. 4032×3024, cropped to 16:9 from y=106; no upscaling. Replaced the Pinterest image 2026-09-24 | [Unsplash License](https://unsplash.com/license) (commercial use allowed, attribution not required) |

**Provenance.** Until 2026-09-24 all three were images Mohamed had found on
Pinterest, with no recorded source. Before replying to App Review (which asked
for documentation of third-party material), each was replaced by, or traced to,
a photo on Unsplash or Pexels with its page linked above. Neither licence
requires attribution; the in-app Credits screen names the photographers anyway.
Keep it that way: no photo goes in without a source page that states its licence.

## When adding more

If a photo comes from **Wikimedia Commons / Flickr / Unsplash / Pexels**, record
its author + licence here. CC-BY / CC-BY-SA images **require attribution** — set
the `credit` field on the photo in `src/lib/display-photos.ts` (e.g.
`"Author · CC BY-SA 4.0"`); it renders faint in the corner. Own photos and CC0 /
public-domain images can omit `credit`.

Downscale new images to ≤2560px before committing (keeps the kiosk fast).
