"""Capture app screens from the plugged-in phone via adb, scrub the status bar,
and publish to the editor. usage: python capture.py <prefix>   e.g. en"""
import subprocess, sys, time, pathlib, shutil
from PIL import Image
prefix = sys.argv[1]
here = pathlib.Path(__file__).parent
raw, clean = here / "raw", here / "clean"
pub = pathlib.Path(r"F:\CodeBase\tools\open-screenshot-generator\public\shots")
PKG = "app.kametrix.prayer"
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
sh("adb", "shell", "am", "start", "-W", "-n", f"{PKG}/.MainActivity"); time.sleep(14)
cap("home")
for r in ["qibla", "month", "dua", "mosques", "settings", "tasbih"]:
    sh("adb", "shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", f"prayer://{r}", PKG); time.sleep(5)
    cap(r)
sh("adb", "shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", "prayer://display", PKG); time.sleep(7)
cap("display_wall")
for n in ["home", "qibla", "month", "dua", "mosques", "settings", "tasbih", "display_wall"]:
    scrub(n); shutil.copy(clean / f"{prefix}_{n}.png", pub / f"{prefix}_{n}.png"); print("ok", n)
