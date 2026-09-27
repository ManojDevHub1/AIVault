import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:8000/tools/chatgpt/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://localhost:9226/json');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.url.includes('localhost:8000'));
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  };
  await new Promise(r => ws.onopen = r);

  function cmd(method, params = {}) {
    return new Promise(r => {
      const cid = id++;
      pending.set(cid, r);
      ws.send(JSON.stringify({ id: cid, method, params }));
    });
  }

  await cmd('Page.enable');
  await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cmd('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight)' });
  await new Promise(r => setTimeout(r, 400));
  const snap1 = await cmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT_DIR, 'screenshots/39_tool_chatgpt_related_and_footer_1440px.png'), Buffer.from(snap1.result.data, 'base64'));

  // Mobile 390px scrolled to related tools
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cmd('Runtime.evaluate', { expression: 'document.querySelector(".related-tools-section").scrollIntoView()' });
  await new Promise(r => setTimeout(r, 400));
  const snap2 = await cmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT_DIR, 'screenshots/40_tool_chatgpt_related_390px.png'), Buffer.from(snap2.result.data, 'base64'));

  // Homepage footer 1440px
  await cmd('Page.navigate', { url: 'http://localhost:8000/index.html' });
  await new Promise(r => setTimeout(r, 600));
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cmd('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight)' });
  await new Promise(r => setTimeout(r, 400));
  const snap3 = await cmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT_DIR, 'screenshots/41_homepage_footer_1440px.png'), Buffer.from(snap3.result.data, 'base64'));

  console.log('Successfully captured screenshots 39, 40, and 41.');
  edge.kill();
  process.exit(0);
}

run();
