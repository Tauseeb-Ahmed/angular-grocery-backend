const fs = require('fs').promises
const path = require('path')

// Use /tmp for Vercel (writable); fallback to local path for development
const TMP_DB_PATH = '/tmp/db.json'
const LOCAL_DB_PATH = path.join(__dirname, '..', 'db.json')
const DB_PATH = process.env.VERCEL ? TMP_DB_PATH : LOCAL_DB_PATH

async function initDB() {
  try {
    await fs.stat(DB_PATH)
  } catch {
    // DB doesn't exist, try to copy from local db.json
    try {
      const localData = await fs.readFile(LOCAL_DB_PATH, 'utf8')
      await fs.writeFile(DB_PATH, localData, 'utf8')
    } catch {
      // No local db.json, create empty
      await fs.writeFile(DB_PATH, JSON.stringify({ groceries: [] }, null, 2), 'utf8')
    }
  }
}

async function readDB() {
  await initDB()
  const txt = await fs.readFile(DB_PATH, 'utf8')
  return JSON.parse(txt || '{}')
}

async function writeDB(db) {
  await initDB()
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  setCors(res)
  res.end(JSON.stringify(body))
}

function parseId(s) {
  if (!s) return null
  const n = Number(s)
  return Number.isNaN(n) ? s : n
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : null
        resolve(data)
      } catch (e) {
        reject(new Error(`Invalid JSON: ${e.message}`))
      }
    })
    req.on('error', reject)
  })
}

module.exports = async (req, res) => {
  try {
    // handle CORS preflight
    if (req.method === 'OPTIONS') {
      setCors(res)
      res.statusCode = 204
      return res.end()
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean)
    if (parts.length === 0) return send(res, 200, { ok: true })

    const resource = parts[0]
    const id = parseId(parts[1])

    const db = await readDB()
    db[resource] = db[resource] || []

    if (req.method === 'GET') {
      if (id == null) return send(res, 200, db[resource])
      const item = db[resource].find(i => i.id == id)
      return item ? send(res, 200, item) : send(res, 404, { error: 'Not found' })
    }

    // parse body for POST/PUT/PATCH/DELETE
    const data = await parseBody(req)

    if (req.method === 'POST') {
      const nextId = db[resource].length ? Math.max(...db[resource].map(i => i.id || 0)) + 1 : 1
      const newItem = Object.assign({ id: nextId }, data || {})
      db[resource].push(newItem)
      await writeDB(db)
      return send(res, 201, newItem)
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (id == null) return send(res, 400, { error: 'Missing id' })
      const idx = db[resource].findIndex(i => i.id == id)
      if (idx === -1) return send(res, 404, { error: 'Not found' })
      const updated = Object.assign({}, db[resource][idx], data || {})
      db[resource][idx] = updated
      await writeDB(db)
      return send(res, 200, updated)
    }

    if (req.method === 'DELETE') {
      if (id == null) return send(res, 400, { error: 'Missing id' })
      const idx = db[resource].findIndex(i => i.id == id)
      if (idx === -1) return send(res, 404, { error: 'Not found' })
      const removed = db[resource].splice(idx, 1)[0]
      await writeDB(db)
      return send(res, 200, removed)
    }

    send(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    console.error(err)
    send(res, 500, { error: String(err) })
  }
}
