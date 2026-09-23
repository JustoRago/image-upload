import express from "express";
import pg from '../db.js'
import { body, validationResult } from 'express-validator'
import pgPromise from "pg-promise";

const PQ = pgPromise.ParameterizedQuery

const categoryValidator = [
  body('category').trim().not().isEmpty().withMessage('Category name is required')
    .isLength({ max: 50 }).withMessage('Category name must be at most 50 characters')
]

const router = express.Router()

// Public category names share one global namespace; a private category name
// only has to be unique within the creating user's own private categories.
function existsQuery(isPrivate, name, creatorId, excludeId) {
  if (isPrivate) {
    return new PQ({
      text: `SELECT EXISTS(
               SELECT 1 FROM categories
               WHERE categoryname = $1 AND private = true AND creator_id = $2
                 ${excludeId ? 'AND id <> $3' : ''}
             ) AS "exists"`,
      values: excludeId ? [name, creatorId, excludeId] : [name, creatorId]
    })
  }
  return new PQ({
    text: `SELECT EXISTS(
             SELECT 1 FROM categories
             WHERE categoryname = $1 AND private = false
               ${excludeId ? 'AND id <> $2' : ''}
           ) AS "exists"`,
    values: excludeId ? [name, excludeId] : [name]
  })
}

// POST /api/v1/categories — create a category (logged in users only)
router.post("/", categoryValidator, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  if (!req.session.user) {
    return res.status(401).send({ status: "failed", message: "Not logged in" });
  }
  try {
    const isPrivate = req.body.privacy === true;
    const name = req.body.category.trim();

    const existing = await pg.one(existsQuery(isPrivate, name, req.session.user.id))
    if (existing.exists) {
      return res.status(409).json({ status: "failed", message: "Category already exists" });
    }

    const inserted = await pg.one(new PQ({
      text: `
        INSERT INTO categories (categoryName, created_at, private, creator_id)
        VALUES ($1, current_timestamp, $2, $3)
        RETURNING id, categoryname
      `,
      values: [name, isPrivate, req.session.user.id]
    }));
    return res.send({
      status: "success",
      message: "Category created",
      data: { name: inserted.categoryname, id: inserted.id },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ status: "failed", message: "Category already exists" });
    }
    console.error('Error inserting category', err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

// GET /api/v1/categories — public categories, plus your own private ones
router.get("/", async (req, res) => {
  try {
    const allCategories = req.session.user
      ? new PQ({ text: `SELECT * FROM categories WHERE creator_id = $1 OR private = false`, values: [req.session.user.id] })
      : new PQ({ text: `SELECT * FROM categories WHERE private = false` });

    const result = await pg.any(allCategories);
    return res.send({
      status: "success",
      message: "Categories sent",
      data: { categories: result },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

// GET /api/v1/categories/:id — a single category (public, or yours if private)
router.get("/:id", async (req, res) => {
  try {
    const categoryById = req.session.user
      ? new PQ({
          text: `SELECT * FROM categories WHERE id = $1 AND (creator_id = $2 OR private = false)`,
          values: [req.params.id, req.session.user.id]
        })
      : new PQ({
          text: `SELECT * FROM categories WHERE id = $1 AND private = false`,
          values: [req.params.id]
        });

    const result = await pg.any(categoryById);
    return res.send({
      status: "success",
      message: "Category sent",
      data: { category: result },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

// PATCH /api/v1/categories/:id — rename or toggle privacy of your own category
router.patch("/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send({ status: "failed", message: "Not logged in" });
  }
  try {
    const categoryId = req.params.id;
    const rows = await pg.any(new PQ({
      text: `SELECT id, categoryname, private, creator_id FROM categories WHERE id = $1`,
      values: [categoryId]
    }));
    if (!rows.length) {
      return res.status(404).send({ status: "failed", message: "Category not found" });
    }
    if (rows[0].creator_id !== req.session.user.id) {
      return res.status(403).send({ status: "failed", message: "You can only edit your own categories" });
    }

    // Partial updates are allowed: omitting `category` keeps the current name,
    // omitting `privacy` keeps the current visibility.
    const hasName = Object.prototype.hasOwnProperty.call(req.body, 'category');
    const newName = hasName ? String(req.body.category).trim() : String(rows[0].categoryname);
    const newPrivacy = typeof req.body.privacy === 'boolean' ? req.body.privacy : Boolean(rows[0].private);
    if (hasName && !newName) {
      return res.status(400).send({ status: "failed", message: "Category name must be 1-50 characters" });
    }
    if (newName.length > 50) {
      return res.status(400).send({ status: "failed", message: "Category name must be 1-50 characters" });
    }

    const existing = await pg.one(existsQuery(newPrivacy, newName, req.session.user.id, categoryId))
    if (existing.exists) {
      return res.status(409).json({ status: "failed", message: "Category already exists" });
    }

    const updated = await pg.one(new PQ({
      text: `
        UPDATE categories SET categoryname = $1, private = $2
        WHERE id = $3
        RETURNING id, categoryname, private
      `,
      values: [newName, newPrivacy, categoryId]
    }));

    return res.send({
      status: "success",
      message: "Category updated",
      data: { id: updated.id, name: updated.categoryname, private: updated.private },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ status: "failed", message: "Category already exists" });
    }
    console.error(err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

// DELETE /api/v1/categories/:id — delete one of your own empty categories
router.delete("/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send({ status: "failed", message: "Not logged in" });
  }
  try {
    const categoryId = req.params.id;
    const rows = await pg.any(new PQ({
      text: `SELECT id, creator_id FROM categories WHERE id = $1`,
      values: [categoryId]
    }));
    if (!rows.length) {
      return res.status(404).send({ status: "failed", message: "Category not found" });
    }
    if (rows[0].creator_id !== req.session.user.id) {
      return res.status(403).send({ status: "failed", message: "You can only delete your own categories" });
    }

    const imagesInCategory = await pg.one(new PQ({
      text: `SELECT COUNT(*)::int AS n FROM images WHERE category = $1`,
      values: [categoryId]
    }));
    if (imagesInCategory.n > 0) {
      return res.status(409).send({
        status: "failed",
        message: "Category is not empty — delete its images first",
      });
    }

    await pg.none('DELETE FROM categories WHERE id = $1', [categoryId])
    return res.send({ status: "success", message: "Category deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

export default router;