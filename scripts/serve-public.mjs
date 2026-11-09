/**
 * Static server for /public only (deck charts, screenshots, etc.).
 * Run: npm run serve:public
 * Open: http://127.0.0.1:8080/  (default port; override with PORT=3000)
 *
 * Note: http://localhost/ with no port targets port 80. That is usually empty unless you bind
 * with sudo or run another stack. Prefer the URL printed below.
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../public')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const port = Number.parseInt(process.env.PORT || '8080', 10)
const host = process.env.HOST || '127.0.0.1'

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent(reqPath.split('?')[0])
  const rel = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '')
  const abs = path.join(root, rel)
  if (!abs.startsWith(root)) return null
  return abs
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400)
    res.end()
    return
  }

  let filePath = safeJoin(ROOT, req.url === '/' ? '/index.html' : req.url)

  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Forbidden')
    return
  }

  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
        return
      }

      const ext = path.extname(filePath).toLowerCase()
      const type = MIME[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': type })
      res.end(data)
    })
  })
})

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Serving ${ROOT}`)
  // eslint-disable-next-line no-console
  console.log(`Open: http://${host}:${port}/`)
  // eslint-disable-next-line no-console
  console.log(`Charts: http://${host}:${port}/analytics-deck-charts.html`)
})
