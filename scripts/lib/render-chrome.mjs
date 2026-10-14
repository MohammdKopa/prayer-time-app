// Render HTML to images with headless Chrome over the DevTools protocol, so
// generated art (icons, store images) is drawn by the same engine as the
// app's WebView. Set CHROME if Chrome is installed elsewhere.

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Open Chrome, run `job(render)`, close Chrome. `render(html, width, height,
 * file, { format, settleMs })` writes one image: PNG keeps transparency, JPEG
 * has none (what the App Store wants for its creative assets).
 */
export async function withChrome(job, port = 9336) {
  const prof = mkdtempSync(path.join(tmpdir(), "render-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${prof}`,
    "--no-first-run",
    "about:blank",
  ]);
  try {
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      try {
        await fetch(`http://127.0.0.1:${port}/json/version`);
        break;
      } catch {}
    }
    const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    let id = 0;
    const pending = new Map();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        pending.get(m.id)(m);
        pending.delete(m.id);
      }
    };
    const send = (method, params = {}) =>
      new Promise((r) => {
        const i = ++id;
        pending.set(i, r);
        ws.send(JSON.stringify({ id: i, method, params }));
      });
    await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });

    const render = async (html, width, height, file, { format = "png", settleMs = 400 } = {}) => {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
      await send("Page.navigate", { url: `data:text/html;base64,${Buffer.from(html).toString("base64")}` });
      await sleep(settleMs);
      await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true });
      const shot = await send("Page.captureScreenshot", {
        format,
        ...(format === "jpeg" ? { quality: 92 } : {}),
        clip: { x: 0, y: 0, width, height, scale: 1 },
        captureBeyondViewport: true,
      });
      if (!shot.result) throw new Error(`render failed for ${file}: ${JSON.stringify(shot.error)}`);
      writeFileSync(file, Buffer.from(shot.result.data, "base64"));
    };

    await job(render);
    ws.close();
  } finally {
    chrome.kill();
    await sleep(300);
    try {
      rmSync(prof, { recursive: true, force: true });
    } catch {}
  }
}
