import express from "express";
import fileupload from "express-fileupload";
import cors from "cors";
import session from 'express-session'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'
import pg from './db.js'
import pgSession from 'connect-pg-simple'

const app = express();

import imagesRoutes from './routes/images.js'
import categoriesRoutes from './routes/categories.js'
import usersRoutes from './routes/users.js'
import { seedDefaultUser } from './seed.js'
import { runMigrations } from './migrate.js'
import { UPLOAD_DIR } from './storedFiles.js'

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH"],
  preflightContinue: true,
  credentials: true
}

app.use(helmet());
app.use(cors(corsOptions));

// Brute-force guard for the credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // The test suite logs in dozens of times, so the limiter only bites in
  // real (dev/prod) processes.
  limit: process.env.NODE_ENV === 'test' ? 500 : 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { status: "failed", message: "Too many attempts. Try again in a few minutes." },
});
app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/signup", authLimiter);

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
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB per file
      files: 5,
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only expose uploaded images (under /uploads), not the whole server directory.
app.use('/uploads', express.static(UPLOAD_DIR))
// Back-compat: rows saved before the /uploads change stored filepaths as
// './imagefolder/...' — keep those servable too.
app.use('/imagefolder', express.static(UPLOAD_DIR))

async function initializeDatabase() {
  try {
    await runMigrations()
    await seedDefaultUser()
    console.log('Database initialization complete')
  } catch (err) {
    console.error('Error creating tables', err)
    process.exit(1)
  }
}

// Top-level await: the app is only exported (and only starts serving) after
// the database is initialized. Tests import this module and must not race the
// schema/seed step, especially on a freshly-created test database.
await initializeDatabase();

app.use("/api/v1/images", imagesRoutes)
app.use("/api/v1/categories", categoriesRoutes)
app.use("/api/v1/users", usersRoutes)

// Central error handler — a safety net for anything that forwards an error
// (route handlers already return a consistent { status, message } shape).
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  console.error(err)
  return res.status(err.status || 500).json({ status: "error", message: err.message })
});

const port = 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server started on port ${port}`));
}

export default app;