import express from "express";
import pg from '../db.js'
import { body, validationResult } from 'express-validator'
import pgPromise from "pg-promise";

const PQ = pgPromise.ParameterizedQuery

const categoryValidator = [
  body('category').not().isEmpty()
]

const router = express.Router()

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
    const result = await pg.one(new PQ({
      text: `SELECT EXISTS(SELECT 1 FROM categories WHERE categoryName=$1) AS "exists"`,
      values: [req.body.category]
    }));

    if (result.exists) {
      return res.send({ status: "failed", message: "Category already exists" });
    }

    const isPrivate = req.body.privacy === true;
    await pg.none(new PQ({
      text: `
        INSERT INTO categories (categoryName, created_at, private, creator_id)
        VALUES ($1, current_timestamp, $2, $3)
      `,
      values: [req.body.category, isPrivate, req.session.user.id]
    }));
    return res.send({
      status: "success",
      message: "Category created",
      data: { name: req.body.category },
    });
  } catch (err) {
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

export default router;