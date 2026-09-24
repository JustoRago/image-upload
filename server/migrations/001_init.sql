-- Base schema. Kept idempotent (IF NOT EXISTS) so existing databases from
-- before migrations were introduced can adopt it without being rebuilt.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users(
  id serial PRIMARY KEY,
  username text NOT NULL,
  created_at timestamp,
  email text NOT NULL,
  password text NOT NULL
);

CREATE TABLE IF NOT EXISTS categories(
  id serial PRIMARY KEY,
  categoryName text NOT NULL,
  created_at timestamp,
  private boolean,
  creator_id int references users(id)
);

CREATE TABLE IF NOT EXISTS images(
  id serial PRIMARY KEY,
  img_name text NOT NULL,
  category int references categories(id),
  upload_id int references users(id),
  created_at timestamp,
  updated_at timestamp,
  filepath text NOT NULL
);

-- Schema evolution for databases created before updated_at existed:
-- CREATE TABLE IF NOT EXISTS does not alter existing tables.
ALTER TABLE images ADD COLUMN IF NOT EXISTS updated_at timestamp;