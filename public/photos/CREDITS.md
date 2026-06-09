# Photo credits — mosque wall display (`/display`)

Full-screen photographs shown on the mosque display.

| File | Source | Licence |
|---|---|---|
| `aqsa.jpg` | Provided by Mohamed | — (confirm before publishing) |
| `makkah.jpg` | Provided by Mohamed; AI-upscaled 4× (Real-ESRGAN x4plus) to 2560px | — (confirm before publishing) |
| `umayyad-damascus.jpg` | Provided by Mohamed; AI-upscaled 4× (Real-ESRGAN x4plus) to 2520px | — (confirm before publishing) |

## When adding more

If a photo comes from **Wikimedia Commons / Flickr / Unsplash / Pexels**, record
its author + licence here. CC-BY / CC-BY-SA images **require attribution** — set
the `credit` field on the photo in `src/lib/display-photos.ts` (e.g.
`"Author · CC BY-SA 4.0"`); it renders faint in the corner. Own photos and CC0 /
public-domain images can omit `credit`.

Downscale new images to ≤2560px before committing (keeps the kiosk fast).
