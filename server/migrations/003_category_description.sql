-- Category descriptions: optional free-form text (one or more paragraphs) set
-- when a category is created and editable afterwards. NULL means "no
-- description".
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text;