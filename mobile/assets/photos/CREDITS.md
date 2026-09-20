# Photo credits — mosque display (mobile)

Downscaled copies (≤1920 px, q4) of `/public/photos` on the website; same photos, same credits. Update both when the set changes.

Full-screen photographs shown on the mosque display.

| File | Source | Licence |
|---|---|---|
| `aqsa.jpg` | Provided by Mohamed | Free to use — see note below |
| `makkah.jpg` | Provided by Mohamed; AI-upscaled 4× (Real-ESRGAN x4plus) to 2560px | Free to use — see note below |
| `umayyad-damascus.jpg` | Provided by Mohamed; AI-upscaled 4× (Real-ESRGAN x4plus) to 2520px | Free to use — see note below |

**Provenance, recorded 2026-09-20, before the first Play release.** Mohamed
found all three through Pinterest and confirms he checked at the time that they
were free to use. The originating site was not recorded, so there is no licence
page to cite and no author to attribute. Kept on that basis, as his decision.

If a rights holder ever gets in touch, the swap is cheap — same three filenames,
nothing else to change. Verified free-licence alternatives that were found on
2026-09-20 and can drop straight in:

- Makkah — *Masjid al-Haram, Tawaf 20092012 1130PM (8008466944).jpg*, CC BY 2.0,
  Basheer Olakara, Wikimedia Commons
- Damascus — *Damascus, Umayyad Mosque (6368698875).jpg*, CC BY 2.0,
  Arian Zwegers, Wikimedia Commons
- Jerusalem — *Jerusalem Dome of the rock BW 8.JPG*, public domain,
  Berthold Werner, Wikimedia Commons

The two CC BY ones would need the `credit` field set; the public-domain one
would not.

## When adding more

If a photo comes from **Wikimedia Commons / Flickr / Unsplash / Pexels**, record
its author + licence here. CC-BY / CC-BY-SA images **require attribution** — set
the `credit` field on the photo in `src/lib/display-photos.ts` (e.g.
`"Author · CC BY-SA 4.0"`); it renders faint in the corner. Own photos and CC0 /
public-domain images can omit `credit`.

Downscale new images to ≤2560px before committing (keeps the kiosk fast).
