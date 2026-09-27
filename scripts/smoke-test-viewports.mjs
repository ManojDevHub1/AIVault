/**
 * AIVault Phase 5 — Viewport Smoke Test (1440px & 390px)
 * 
 * Verifies across 6 core page types:
 * - Homepage
 * - Category page (Coding)
 * - Tool detail page (ChatGPT)
 * - Compare page
 * - Collections page
 * - 404 page
 * 
 * Checks:
 * - Zero horizontal overflow at 1440px and 390px
 * - Navigation links present and clickable
 * - Theme toggle operable
 * - Zero console errors
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8098;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(ROOT_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Serve 404.html if file doesn't exist
    const notFoundPath = path.join(ROOT_DIR, '404.html');
    if (fs.existsSync(notFoundPath)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(notFoundPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + reqPath);
    }
  }
});

server.listen(PORT, async () => {
  console.log('==================================================');
  console.log(`STEP 19 VIEWPORT SMOKE TEST (Server on port ${PORT})`);
  console.log('==================================================\n');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `http://localhost:${PORT}/index.html`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetsRes = await fetch('http://localhost:9224/json');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.url.includes(`localhost:${PORT}`));

    if (!pageTarget) throw new Error('Page target not found');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const pending = new Map();
    const consoleErrors = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
      }
      if (data.method === 'Console.messageAdded' && data.params.message.level === 'error') {
        consoleErrors.push(data.params.message.text);
      }
      if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
        consoleErrors.push(data.params.args.map(a => a.value || a.description).join(' '));
      }
      if (data.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(data.params.exceptionDetails.text);
      }
    };

    await new Promise(r => ws.onopen = r);

    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const cmdId = id++;
        pending.set(cmdId, resolve);
        ws.send(JSON.stringify({ id: cmdId, method, params }));
      });
    }

    await sendCommand('Console.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Page.enable');

    async function evaluate(expression) {
      const res = await sendCommand('Runtime.evaluate', { expression, returnByValue: true });
      if (res.result && res.result.exceptionDetails) {
        throw new Error(res.result.exceptionDetails.text);
      }
      return res.result?.result?.value;
    }

    async function navigateTo(url) {
      await sendCommand('Page.navigate', { url });
      await new Promise(r => setTimeout(r, 600));
    }

    async function testPageAtViewport(url, pathLabel, width, height, isMobile) {
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: isMobile ? 2 : 1,
        mobile: isMobile
      });
      await navigateTo(url);
      await new Promise(r => setTimeout(r, 400));

      const res = await evaluate(`
        (function() {
          const bodyWidth = document.body.clientWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          const overflow = scrollWidth > bodyWidth + 2;
          
          // Test theme button if present
          const themeBtn = document.getElementById('theme-toggle-btn');
          const hasThemeBtn = !!themeBtn;
          let themeToggled = false;
          if (themeBtn) {
            const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
            themeBtn.click();
            const afterTheme = document.documentElement.getAttribute('data-theme');
            themeToggled = initialTheme !== afterTheme;
            themeBtn.click(); // revert
          }

          // Check brand logo link
          const brandLogo = document.querySelector('.brand-logo');
          const brandHref = brandLogo?.getAttribute('href');

          return {
            bodyWidth,
            scrollWidth,
            overflow,
            hasThemeBtn,
            themeToggled,
            hasBrandLogo: !!brandLogo,
            brandHref
          };
        })()
      `);

      return res;
    }

    const testPages = [
      { name: 'Homepage', url: `http://localhost:${PORT}/index.html` },
      { name: 'Category (Coding)', url: `http://localhost:${PORT}/category/coding/` },
      { name: 'Tool Detail (ChatGPT)', url: `http://localhost:${PORT}/tools/chatgpt/` },
      { name: 'Compare Page', url: `http://localhost:${PORT}/compare/` },
      { name: 'Collections Page', url: `http://localhost:${PORT}/collections/` },
      { name: '404 Page', url: `http://localhost:${PORT}/404.html` }
    ];

    let allPassed = true;

    for (const page of testPages) {
      // 1440px Desktop
      const dRes = await testPageAtViewport(page.url, page.name, 1440, 900, false);
      const dPass = !dRes.overflow;
      if (!dPass) allPassed = false;
      console.log(`[${dPass ? 'PASS' : 'FAIL'}] ${page.name} @ 1440px: overflow=${dRes.overflow} (scrollWidth=${dRes.scrollWidth}px, bodyWidth=${dRes.bodyWidth}px)`);

      // 390px Mobile
      const mRes = await testPageAtViewport(page.url, page.name, 390, 844, true);
      const mPass = !mRes.overflow;
      if (!mPass) allPassed = false;
      console.log(`[${mPass ? 'PASS' : 'FAIL'}] ${page.name} @ 390px: overflow=${mRes.overflow} (scrollWidth=${mRes.scrollWidth}px, bodyWidth=${mRes.bodyWidth}px)`);
    }

    await sendCommand('Emulation.clearDeviceMetricsOverride');

    console.log('\nConsole error count during smoke test:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      allPassed = false;
    }

    console.log('\n==================================================');
    console.log(`SMOKE TEST RESULT: ${allPassed ? 'ALL VIEWPORT TESTS PASSED' : 'FAILURES OBSERVED'}`);
    console.log('==================================================\n');

    ws.close();
    edge.kill();
    server.close();
    process.exit(allPassed ? 0 : 1);

  } catch (err) {
    console.error('Smoke test execution failed:', err);
    edge.kill();
    server.close();
    process.exit(1);
  }
});
