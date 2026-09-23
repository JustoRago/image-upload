import app from '../server'
import session from 'supertest-session'
import request from 'supertest'
import pg from '../db.js'
import { unlinkStoredFile } from '../storedFiles.js'

// A tiny 1x1 transparent PNG used as the uploaded file in tests.
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

// A unique name, so tests never collide with each other or with repeated runs.
export const unique = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// Creates a fresh authenticated session for the fixture user
// (asdt560 / justojose1 — auto-seeded at server start).
export function loginSession(username = 'asdt560', password = 'justojose1') {
  const s = session(app)
  return new Promise((resolve, reject) => {
    s.post('/api/v1/users/login')
      .send({ username, password })
      .expect(200)
      .end((err) => (err ? reject(err) : resolve(s)))
  })
}

// Removes the real file on disk for a stored filepath like
// `uploads/<categoryId>/<name>`. Re-exported from ../storedFiles.js so test
// cleanup maps files into the (temp) upload directory just like the app does.
export { unlinkStoredFile }

export async function deleteImageById(id) {
  if (!id) return
  const rows = await pg.any('SELECT filepath FROM images WHERE id = $1', [id])
  await pg.none('DELETE FROM images WHERE id = $1', [id])
  for (const row of rows) unlinkStoredFile(row.filepath)
}

export async function deleteImagesByUsername(username) {
  const rows = await pg.any(
    `SELECT images.id, images.filepath
     FROM images
     INNER JOIN users ON images.upload_id = users.id
     WHERE users.username = $1`,
    [username]
  )
  for (const row of rows) {
    await pg.none('DELETE FROM images WHERE id = $1', [row.id])
    unlinkStoredFile(row.filepath)
  }
}

export async function deleteCategoryById(id) {
  if (id) await pg.none('DELETE FROM categories WHERE id = $1', [id])
}

export async function deleteUsersByUsername(...usernames) {
  if (usernames.length) {
    await pg.none('DELETE FROM users WHERE username IN ($1:csv)', [usernames])
  }
}

export async function signupUser(username, email, password) {
  const res = await request(app)
    .post('/api/v1/users/signup')
    .send({ username, email, password })
  return res
}

// Close the connection pool when a test file is done. Without this, the
// process (single serial worker) never exits after the last suite.
afterAll(async () => {
  await pg.$pool.end().catch(() => {})
});