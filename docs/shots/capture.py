"""Capture app screens from the plugged-in phone via adb, scrub the status bar,
and publish to the editor. usage: python capture.py <prefix>   e.g. en
PKG=app.kametrix.prayer.dev python capture.py en   to shoot the side-by-side test build.
Quran shots open the reader by deep link; tajweed shows if it is switched on
in the app (the setting is remembered), so switch it on before a run."""
import os, subprocess, sys, time, pathlib, shutil
from PIL import Image
prefix = sys.argv[1]
here = pathlib.Path(__file__).parent
raw, clean = here / "raw", here / "clean"
pub = pathlib.Path(r"F:\CodeBase\tools\open-screenshot-generator\public\shots")
PKG = os.environ.get("PKG", "app.kametrix.prayer")
def sh(*a): return subprocess.run(a, capture_output=True)
def cap(name):
    png = subprocess.run(["adb", "exec-out", "screencap", "-p"], capture_output=True).stdout
    (raw / f"{prefix}_{name}.png").write_bytes(png)
def scrub(name):
    im = Image.open(raw / f"{prefix}_{name}.png").convert("RGB")
    w, h = im.size
    if w > h:  # landscape wall: leave as is
        im.save(clean / f"{prefix}_{name}.png", optimize=True); return
    bg = im.getpixel((20, 160)); bar = 110
    for y in range(60, 140):
        if all(sum(abs(a - b) for a, b in zip(im.getpixel((x, y)), bg)) < 12 for x in range(0, w, 40)):
            bar = y; break
    im.paste(bg, (0, 0, w, bar)); im.save(clean / f"{prefix}_{name}.png", optimize=True)
sh("adb", "shell", "am", "force-stop", PKG)
sh("adb", "shell", "am", "start", "-W", "-n", f"{PKG}/app.kametrix.prayer.MainActivity"); time.sleep(22)  # GPS fix, so the clock shows the city
cap("home")
for r in ["qibla", "month", "dua", "mosques", "settings", "tasbih"]:
    sh("adb", "shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", f"prayer://{r}", PKG); time.sleep(5)
    cap(r)
# 1.1: the Quran tab, a mushaf page (al-Mulk opens p. 562; Luqman p. 411 has
# more tajweed), and the guided tasbih after prayer.
for name, link, wait in [
    ("quran", "prayer://quran", 5),
    ("quran_page", "prayer://quran/67?ayah=1", 7),
    ("quran_tajweed", "prayer://quran/31?ayah=6", 7),
    ("tasbih_after_prayer", "prayer://tasbih?mode=afterPrayer", 5),
]:
    sh("adb", "shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", link, PKG); time.sleep(wait)
    cap(name)
sh("adb", "shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", "prayer://display", PKG); time.sleep(7)
cap("display_wall")
for n in ["home", "qibla", "month", "dua", "mosques", "settings", "tasbih", "quran", "quran_page",
          "quran_tajweed", "tasbih_after_prayer", "display_wall"]:
    # Arabic is the app's base language: its shots carry no prefix in the editor.
    scrub(n); shutil.copy(clean / f"{prefix}_{n}.png", pub / (f"{n}.png" if prefix == "ar" else f"{prefix}_{n}.png")); print("ok", n)
