import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import pg from './db.js'
import { UPLOAD_DIR } from './storedFiles.js'

// A 1x1 transparent PNG so seeded images are real, servable files.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

const DEFAULT_CATEGORIES = [
  { name: 'Nature', private: false },
  { name: 'Food', private: false },
  { name: 'Technology', private: false },
]

const DEFAULT_IMAGES = [
  { img_name: 'Sunset over the lake', category: 'Nature' },
  { img_name: 'Colorful mountains', category: 'Nature' },
  { img_name: 'Homemade pizza', category: 'Food' },
  { img_name: 'Morning coffee', category: 'Food' },
  { img_name: 'Server room', category: 'Technology' },
]

// Creates the default user so a fresh database is usable out of the box.
// Skips if the user already exists. Only runs outside production; the
// credentials are configurable via env vars.
export async function seedDefaultUser() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping default-user seed (NODE_ENV=production)')
    return null
  }
  const username = process.env.SEED_USERNAME || 'asdt560'
  const email = process.env.SEED_EMAIL || 'asdt560@gmail.com'
  const password = process.env.SEED_PASSWORD || 'justojose1'

  const existing = await pg.oneOrNone(
    `SELECT id, username FROM users WHERE username = $1`,
    [username]
  )
  if (existing) {
    console.log(`Default user '${username}' already exists — skipping seed`)
    return existing
  }

  try {
    const row = await pg.one(
      `INSERT INTO users (username, created_at, email, password)
       VALUES ($1, current_timestamp, $2, crypt($3, gen_salt('bf')))
       RETURNING id, username`,
      [username, email, password]
    )
    console.log(
      `Seeded default user '${username}'. ` +
      'Change the password or override via SEED_USERNAME/SEED_PASSWORD/SEED_EMAIL.'
    )
    return row
  } catch (err) {
    if (err.code === '23505') {
      // Lost a seed race with another process (e.g. parallel jest workers on a
      // fresh database) — reuse the fixture row the winner created.
      const row = await pg.oneOrNone(
        `SELECT id, username FROM users WHERE username = $1`,
        [username]
      )
      if (row) return row
    }
    throw err
  }
}

// Creates the default categories if they don't exist yet.
export async function seedCategories(userId) {
  const result = []
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await pg.oneOrNone(
      `SELECT id, categoryname FROM categories WHERE categoryname = $1`,
      [cat.name]
    )
    if (existing) {
      result.push(existing)
      continue
    }
    const row = await pg.one(
      `INSERT INTO categories (categoryName, created_at, private, creator_id)
       VALUES ($1, current_timestamp, $2, $3)
       RETURNING id, categoryname`,
      [cat.name, cat.private, userId]
    )
    console.log(`Seeded category '${cat.name}'`)
    result.push(row)
  }
  return result
}

// Creates the default images (real tiny PNG files on disk) if they don't exist.
export async function seedImages(userId, categories) {
  let seeded = 0
  for (const img of DEFAULT_IMAGES) {
    const existing = await pg.oneOrNone(
      `SELECT 1 FROM images WHERE img_name = $1`,
      [img.img_name]
    )
    if (existing) continue

    const cat = categories.find((c) => c.categoryname === img.category)
    if (!cat) {
      console.log(`  skip '${img.img_name}' — category '${img.category}' not found`)
      continue
    }

    const fileName = `${img.img_name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')}.png`
    const fullDir = path.join(UPLOAD_DIR, String(cat.id))
    const storedPath = `uploads/${cat.id}/${fileName}`

    fs.mkdirSync(fullDir, { recursive: true })
    fs.writeFileSync(path.join(fullDir, fileName), TINY_PNG)

    await pg.none(
      `INSERT INTO images (img_name, category, upload_id, created_at, updated_at, filepath)
       VALUES ($1, $2, $3, current_timestamp, current_timestamp, $4)`,
      [img.img_name, cat.id, userId, storedPath]
    )
    console.log(`Seeded image '${img.img_name}' -> ${storedPath}`)
    seeded += 1
  }
  return seeded
}

export async function seedAll() {
  const user = await seedDefaultUser()
  const categories = await seedCategories(user?.id ?? null)
  await seedImages(user?.id ?? null, categories)
}

// Runs the full seed only when invoked directly (e.g. `npm run seed`).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('Running database seed...')
  seedAll()
    .then(() => {
      console.log('Seed complete')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}