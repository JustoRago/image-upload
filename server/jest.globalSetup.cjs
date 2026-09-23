// Runs once in the main jest process before any worker starts. Creates the
// dedicated test database if it is missing, then resets its schema so every
// test run starts from a clean slate (tables, sequences, and accumulated
// sessions from previous runs all go away). Also resets the throwaway upload
// folder that tests write into.
require('dotenv').config()
const { Client } = require('pg')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const testDbName = () =>
  process.env.TEST_DBNAME || `${process.env.DBNAME || 'image_upload'}_test`

const uploadDir = () => path.join(os.tmpdir(), 'image-upload-tests')

const baseCreds = () => ({
  user: process.env.DBUSER,
  password: process.env.DBPASS,
  host: process.env.DBHOST || 'localhost',
  port: Number(process.env.DBPORT || process.env.PORT || 5432),
  connectionTimeoutMillis: 5000,
})

// CREATE DATABASE cannot use bind parameters and the identifier must be quoted.
const quoteIdent = (name) => `"${name.replace(/"/g, '""')}"`

async function connect(dbname) {
  const client = new Client({ ...baseCreds(), database: dbname })
  await client.connect()
  return client
}

module.exports = async function globalSetup() {
  const dbname = testDbName()

  // Bootstrap against some database the role can already reach. 'postgres' is
  // the standard maintenance DB; fall back to the dev DB name.
  let bootstrap
  for (const candidate of ['postgres', process.env.DBNAME || 'image_upload']) {
    try {
      bootstrap = await connect(candidate)
      break
    } catch (err) {
      console.warn(`Could not connect to "${candidate}" to bootstrap the test database: ${err.message}`)
    }
  }
  if (!bootstrap) {
    throw new Error(
      `Cannot reach PostgreSQL to set up test database "${dbname}". ` +
      'Check that Postgres is running and server/.env has DBUSER/DBPASS/DBHOST/DBPORT set.'
    )
  }

  try {
    const exists = await bootstrap.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbname])
    if (!exists.rowCount) {
      await bootstrap.query(`CREATE DATABASE ${quoteIdent(dbname)}`)
      console.log(`Created test database "${dbname}"`)
    }
  } finally {
    await bootstrap.end()
  }

  // Reset the schema. Drops every table/sequence/session row from earlier
  // runs; the first test worker recreates the schema via initializeDatabase().
  const testClient = await connect(dbname)
  try {
    await testClient.query('DROP SCHEMA IF EXISTS public CASCADE')
    await testClient.query('CREATE SCHEMA public')
    await testClient.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
  } catch (err) {
    if (err.code === '42501') {
      throw new Error(
        `Cannot reset test database "${dbname}": ${err.message}. ` +
        'The Postgres role must own that database (or be a superuser).'
      )
    }
    throw err
  } finally {
    await testClient.end()
  }

  // Fresh throwaway upload folder for this run.
  fs.rmSync(uploadDir(), { recursive: true, force: true })
  fs.mkdirSync(uploadDir(), { recursive: true })
}