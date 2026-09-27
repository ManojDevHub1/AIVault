import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = 8097;
const ROOT_DIR = process.cwd();

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(PORT, async () => {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    `http://localhost:${PORT}/index.html`
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const targets = await (await fetch('http://localhost:9225/json')).json();
  const pageTarget = targets.find(t => t.url.includes(`localhost:${PORT}`));
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d);
      pending.delete(d.id);
    }
  };
  await new Promise(r => ws.onopen = r);
  function cmd(m, p = {}) {
    return new Promise(r => {
      const cid = id++;
      pending.set(cid, r);
      ws.send(JSON.stringify({ id: cid, method: m, params: p }));
    });
  }
  await cmd('Runtime.enable');

  async function bench(expr) {
    const res = await cmd('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res.result?.result?.value;
  }

  const perfMetrics = await bench(`{
    const results = {};
    
    // 1. Search latency (cold)
    let t0 = performance.now();
    const input = document.getElementById('search-input');
    input.value = 'code';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    results.firstSearchMs = +(performance.now() - t0).toFixed(2);

    // 2. Repeated search latency (warm)
    t0 = performance.now();
    input.value = 'video editing';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    results.repeatedSearchMs = +(performance.now() - t0).toFixed(2);

    // 3. Clear search
    t0 = performance.now();
    document.getElementById('search-clear-btn').click();
    results.clearFiltersMs = +(performance.now() - t0).toFixed(2);

    // 4. Multi-facet filter combination
    t0 = performance.now();
    document.querySelector('.sidebar-item[data-category="Video"]').click();
    document.querySelector('.filter-pill[data-pricing="Freemium"]').click();
    results.filterCombinationMs = +(performance.now() - t0).toFixed(2);

    // 5. Load more batch append
    t0 = performance.now();
    document.getElementById('btn-load-more').click();
    results.loadMoreMs = +(performance.now() - t0).toFixed(2);

    // Reset
    document.getElementById('btn-reset-filters').click();

    results;
  }`);

  console.log('--- PRACTICAL BROWSER PERFORMANCE METRICS (176 TOOLS) ---');
  console.log('Cold search latency:', perfMetrics.firstSearchMs, 'ms');
  console.log('Warm/repeated search latency:', perfMetrics.repeatedSearchMs, 'ms');
  console.log('Clear filters latency:', perfMetrics.clearFiltersMs, 'ms');
  console.log('Multi-facet filter combination:', perfMetrics.filterCombinationMs, 'ms');
  console.log('Load More chunk append:', perfMetrics.loadMoreMs, 'ms');

  ws.close();
  edge.kill();
  server.close();
  process.exit(0);
});
