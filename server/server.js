import express from "express";
import fileupload from "express-fileupload";
import cors from "cors";
import session from 'express-session'
import 'dotenv/config'
import pg from './db.js'
import pgSession from 'connect-pg-simple'

const app = express();

import imagesRoutes from './routes/images.js'
import categoriesRoutes from './routes/categories.js'
import usersRoutes from './routes/users.js'

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE"],
  preflightContinue: true,
  credentials: true
}

app.use(cors(corsOptions));

app.use(session(
  {
    store: new (pgSession(session))({
      createTableIfMissing: true,
      pgPromise: pg
    }),
    secret: process.env.SECRET || 'insecure-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true
    }
  }
))

app.use(
  fileupload({
    createParentPath: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only expose uploaded images (under /uploads), not the whole server directory.
app.use('/uploads', express.static('./imagefolder'))
// Back-compat: rows saved before the /uploads change stored filepaths as
// './imagefolder/...' — keep those servable too.
app.use('/imagefolder', express.static('./imagefolder'))

const cryptography = `CREATE EXTENSION IF NOT EXISTS pgcrypto`

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users(
    id serial PRIMARY KEY,
    username text NOT NULL,
    created_at timestamp,
    email text NOT NULL,
    password text NOT NULL
  )
`

const createCategoriesTable =`
  CREATE TABLE IF NOT EXISTS categories(
    id serial PRIMARY KEY,
    categoryName text NOT NULL,
    created_at timestamp,
    private boolean,
    creator_id int references users(id)
  )
`

const createImagesTable = `
  CREATE TABLE IF NOT EXISTS images(
    id serial PRIMARY KEY,
    img_name text NOT NULL,
    category int references categories(id),
    upload_id int references users(id),
    created_at timestamp,
    updated_at timestamp,
    filepath text NOT NULL
  );
`

// Creates a default user so a fresh database is usable out of the box.
// Only runs outside production; credentials are configurable via env vars and
// default to the credentials the test suite expects.
async function seedDefaultUser() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping default-user seed (NODE_ENV=production)')
    return
  }
  const username = process.env.SEED_USERNAME || 'asdt560'
  const email = process.env.SEED_EMAIL || 'asdt560@gmail.com'
  const password = process.env.SEED_PASSWORD || 'justojose1'

  const existing = await pg.oneOrNone(`SELECT 1 FROM users WHERE username = $1`, [username])
  if (existing) {
    console.log(`Default user '${username}' already exists — skipping seed`)
    return
  }

  await pg.none(
    `INSERT INTO users (username, created_at, email, password)
     VALUES ($1, current_timestamp, $2, crypt($3, gen_salt('bf')))`,
    [username, email, password]
  )
  console.log(
    `Seeded default user '${username}'. ` +
    'Change the password or override via SEED_USERNAME/SEED_PASSWORD/SEED_EMAIL.'
  )
}

async function initializeDatabase() {
  try {
    await pg.any(cryptography)
    await pg.any(createUsersTable)
    await pg.any(createCategoriesTable)
    await pg.any(createImagesTable)
    // Schema evolution for databases created before updated_at existed:
    // CREATE TABLE IF NOT EXISTS does not alter existing tables.
    await pg.any(`ALTER TABLE images ADD COLUMN IF NOT EXISTS updated_at timestamp`)
    await seedDefaultUser()
    console.log('Database initialization complete')
  } catch (err) {
    console.error('Error creating tables', err)
    process.exit(1)
  }
}

initializeDatabase();

app.use("/api/v1/images", imagesRoutes)
app.use("/api/v1/categories", categoriesRoutes)
app.use("/api/v1/users", usersRoutes)

const port = 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server started on port ${port}`));
}

export default app;