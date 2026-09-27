/**
 * AIVault — Local Development Static HTTP Server
 * 
 * Features:
 * - Pure Node.js (zero dependencies)
 * - Automatic index.html resolution for directory URLs (/tools/chatgpt/ -> tools/chatgpt/index.html)
 * - Strict MIME type mapping (HTML, CSS, JS, SVG, XML, JSON)
 * - Clean logging
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // CORS & Security headers for local testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  let rawPath = req.url.split('?')[0];
  try {
    rawPath = decodeURIComponent(rawPath);
  } catch (e) {
    // Keep rawPath as is if decode fails
  }

  if (rawPath === '/') rawPath = '/index.html';
  let filePath = path.join(ROOT_DIR, rawPath);

  // Directory resolution
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const custom404 = path.join(ROOT_DIR, '404.html');
    if (fs.existsSync(custom404)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(custom404).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
<html>
<head><title>404 Not Found — AIVault</title><link rel="stylesheet" href="/style.css"></head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;background:#F8FAFC;">
  <h1 style="font-size:3rem;margin-bottom:8px;color:#0F172A;">404</h1>
  <p style="color:#64748B;margin-bottom:20px;">Page not found: <code>${rawPath}</code></p>
  <a href="/" style="padding:10px 20px;background:#2563EB;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Return to AIVault Home</a>
</body>
</html>`);
    }
  }
});

server.listen(PORT, () => {
  console.log('==================================================');
  console.log(`AIVault Development Server running at:`);
  console.log(`  -> Local:   http://localhost:${PORT}/`);
  console.log(`  -> Tools:   http://localhost:${PORT}/tools/chatgpt/`);
  console.log(`  -> Hubs:    http://localhost:${PORT}/category/coding/`);
  console.log(`  -> Sitemap: http://localhost:${PORT}/sitemap.xml`);
  console.log('==================================================');
});

// Handle graceful termination
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
