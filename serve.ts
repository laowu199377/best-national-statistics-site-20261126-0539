// A tiny static server for viewing the site locally: `node serve.ts`,
// then open http://localhost:8080/ in a desktop browser.
// No build step, no network.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('./app/', import.meta.url));
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  if (path === '/') path = '/index.html';
  const file = await readFile(join(dir, path.slice(1))).catch(() => null);
  if (file === null) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
  res.end(file);
});

server.listen(8080, () => console.log('Singapore by the Numbers at http://localhost:8080/'));
