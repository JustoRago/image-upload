import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import pg from './db.js'

// Migrations are plain SQL files in ./migrations, applied in filename order.
// Each one runs inside a transaction and is recorded in schema_migrations,
// so a migration is applied exactly once per database.
const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

export async function runMigrations() {
  await pg.none(
    `CREATE TABLE IF NOT EXISTS schema_migrations(
       id serial PRIMARY KEY,
       name text NOT NULL UNIQUE,
       applied_at timestamp NOT NULL DEFAULT current_timestamp
     )`
  );

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const applied = await pg.oneOrNone(
      'SELECT 1 FROM schema_migrations WHERE name = $1',
      [file]
    );
    if (applied) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      // Each migration is atomic: statements + bookkeeping commit together.
      await pg.tx(async (t) => {
        // No parameters, so the whole file runs as one simple query.
        await t.none(sql);
        await t.none('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      });
      console.log(`Applied migration ${file}`);
    } catch (err) {
      console.error(`Migration ${file} failed`, err);
      throw err;
    }
  }
}

// Runs all migrations when invoked directly (e.g. `npm run migrate`).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations()
    .then(() => {
      console.log('Migrations complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migrations failed:', err);
      process.exit(1);
    });
}