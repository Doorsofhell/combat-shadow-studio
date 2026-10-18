/** static server for the built lab: lab/dist/<entry>, then public/ (models); gzip like a real host */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { extname, join } from 'node:path';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.wasm': 'application/wasm' };
const roots = ['lab/dist/three', 'lab/dist/babylon', 'public'];
createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  const file = roots.map((r) => join(r, path)).find((f) => existsSync(f) && statSync(f).isFile());
  if (!file) return res.writeHead(404).end();
  let body = readFileSync(file);
  const headers = { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' };
  if (/\.(js|html|json|css)$/.test(file) && (req.headers['accept-encoding'] ?? '').includes('gzip')) {
    body = gzipSync(body, { level: 6 });
    headers['content-encoding'] = 'gzip';
  }
  res.writeHead(200, headers).end(body);
}).listen(5200, () => console.log('lab sur http://localhost:5200'));
