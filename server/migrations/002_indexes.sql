-- Uniqueness guarantees. The API duplicates these checks for friendlier
-- errors, but the indexes back them up so racing requests can never slip
-- through. A database that already contains duplicates must be cleaned up
-- before these can be created (the server will refuse to start otherwise).
--
-- Public category names share one global namespace.
CREATE UNIQUE INDEX IF NOT EXISTS categories_public_name_unique
  ON categories (categoryname) WHERE private = false;

-- Private category names are only unique within the owning user's own
-- private categories.
CREATE UNIQUE INDEX IF NOT EXISTS categories_private_name_unique
  ON categories (categoryname, creator_id) WHERE private = true;

-- Usernames are globally unique (the signup route checks first; this backs
-- it up so parallel requests can never register the same name twice).
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);