import express from "express";
import fs from 'node:fs';
import 'dotenv/config'
import pg from '../db.js'
import pgPromise from "pg-promise";
import { UPLOAD_DIR, unlinkStoredFile } from '../storedFiles.js'

const PQ = pgPromise.ParameterizedQuery

const router = express.Router()

const MAX_IMAGE_NAME_LENGTH = 100;

const imageSelect = `
  SELECT images.*, categories.categoryname AS category_name, users.username AS uploader
  FROM images
  INNER JOIN categories ON images.category = categories.id
  LEFT JOIN users ON images.upload_id = users.id
`

// Sniffs the leading bytes to decide whether a buffer is one of the
// supported image formats. Trusting the client-supplied MIME type would be
// spoofable, so the file content is what gets validated.
function detectImageType(buf) {
  if (!buf || buf.length < 4) return null
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif'
  if (
    buf.length >= 12
    && buf.subarray(0, 4).toString('ascii') === 'RIFF'
    && buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'image/webp'
  return null
}

// GET /api/v1/images?random=true | ?search=term | ?id=5
router.get("/", async (req, res) => {
  const { random, search, id } = req.query;
  try {
    if (random) {
      const result = await pg.any(`
        ${imageSelect}
        WHERE categories.private = false
        ORDER BY RANDOM() LIMIT 1
      `);
      return res.send({ status: "success", body: result });
    }
    if (search) {
      const result = await pg.any(new PQ({
        text: `
          ${imageSelect}
          WHERE img_name ILIKE $1
            AND categories.private = false
        `,
        values: [`%${search}%`]
      }));
      return res.send({ status: "success", body: result });
    }
    if (id) {
      // A private image is only visible to the user who uploaded it.
      const result = req.session.user
        ? await pg.any(new PQ({
            text: `
              ${imageSelect}
              WHERE images.id = $1
                AND (categories.private = false OR images.upload_id = $2)
            `,
            values: [id, req.session.user.id]
          }))
        : await pg.any(new PQ({
            text: `
              ${imageSelect}
              WHERE images.id = $1
                AND categories.private = false
            `,
            values: [id]
          }));
      return res.send({ status: "success", body: result });
    }
    return res.status(400).send({ status: "failed", message: "Missing query parameter: random, search or id" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

// GET /api/v1/images/:categoryId — list images in a category.
// Private categories only show their images to the category owner.
router.get("/:categoryId", async (req, res) => {
  try {
    const result = req.session.user
      ? await pg.any(new PQ({
          text: `
            SELECT images.*
            FROM images
            INNER JOIN categories ON images.category = categories.id
            WHERE images.category = $1
              AND (categories.private = false OR images.upload_id = $2)
          `,
          values: [req.params.categoryId, req.session.user.id]
        }))
      : await pg.any(new PQ({
          text: `
            SELECT images.*
            FROM images
            INNER JOIN categories ON images.category = categories.id
            WHERE images.category = $1
              AND categories.private = false
          `,
          values: [req.params.categoryId]
        }));
    return res.send({ status: "success", body: result });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

// POST /api/v1/images — upload a new image (logged in users only)
router.post("/", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).send({ status: "failed", message: "Not logged in" });
    }
    if (!req.files?.files) {
      return res.status(400).send({ status: "failed", message: "No file uploaded" });
    }
    if (!req.body.img_name) {
      return res.status(400).send({ status: "failed", message: "img_name is required" });
    }
    if (req.body.img_name.length > MAX_IMAGE_NAME_LENGTH) {
      return res.status(400).send({ status: "failed", message: `img_name must be at most ${MAX_IMAGE_NAME_LENGTH} characters` });
    }
    if (req.files.files.truncated) {
      return res.status(400).send({ status: "failed", message: "File exceeds the 10 MB limit" });
    }
    if (!detectImageType(req.files.files.data)) {
      return res.status(400).send({ status: "failed", message: "Only image files (PNG, JPEG, GIF, WebP) are allowed" });
    }

    // Resolve the category through the DB so we only ever use a valid integer id
    // (this also defends against path traversal via req.body.category).
    const category = await pg.any(new PQ({
      text: `SELECT id FROM categories WHERE id = $1 AND (creator_id = $2 OR private = false)`,
      values: [req.body.category, req.session.user.id]
    }));
    if (!category.length) {
      return res.status(400).send({ status: "failed", message: "Invalid category" });
    }
    const categoryId = category[0].id;

    // Sanitize the file name: strip any directory separators and non-safe characters.
    const cleanedName = req.files.files.name.replace(/\\/g, '/');
    const baseName = cleanedName.substring(cleanedName.lastIndexOf('/') + 1);
    const safeName = baseName.replace(/[^A-Za-z0-9._-]/g, '_');

    const file = req.files.files;
    const storeDir = `${UPLOAD_DIR}/${categoryId}`;
    const storedPath = `uploads/${categoryId}/${safeName}`;
    const fullPath = `${storeDir}/${safeName}`;

    await file.mv(fullPath);
    try {
      await pg.none(new PQ({
        text: `
          INSERT INTO images (img_name, category, upload_id, created_at, updated_at, filepath)
          VALUES ($1, $2, $3, current_timestamp, current_timestamp, $4)
        `,
        values: [req.body.img_name, categoryId, req.session.user.id, storedPath]
      }));
    } catch (err) {
      // Don't leave an orphaned file behind if the DB insert fails.
      fs.promises.unlink(fullPath).catch(() => {});
      throw err;
    }

    return res.send({
      status: "success",
      message: "File is uploaded",
      data: {
        name: safeName,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

// PATCH /api/v1/images/:imageId — rename one of your images
router.patch("/:imageId", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).send({ status: "failed", message: "Not logged in" });
    }
    if (!req.body.img_name) {
      return res.status(400).send({ status: "failed", message: "img_name is required" });
    }
    if (req.body.img_name.length > MAX_IMAGE_NAME_LENGTH) {
      return res.status(400).send({ status: "failed", message: `img_name must be at most ${MAX_IMAGE_NAME_LENGTH} characters` });
    }
    const result = await pg.any(new PQ({
      text: `
        UPDATE images
        SET img_name = $1, updated_at = current_timestamp
        WHERE id = $2 AND upload_id = $3
        RETURNING *;
      `,
      values: [req.body.img_name, req.params.imageId, req.session.user.id],
    }));
    if (!result.length) {
      return res.status(404).send({ status: "failed", message: "Image not found or not yours" });
    }
    return res.send({ status: "success", body: result });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

// DELETE /api/v1/images/:imageId — remove one of your images (file + row)
router.delete("/:imageId", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).send({ status: "failed", message: "Not logged in" });
    }
    const rows = await pg.any(new PQ({
      text: `SELECT id, filepath FROM images WHERE id = $1 AND upload_id = $2`,
      values: [req.params.imageId, req.session.user.id]
    }));
    if (!rows.length) {
      return res.status(404).send({ status: "failed", message: "Image not found or not yours" });
    }
    await pg.none('DELETE FROM images WHERE id = $1', [req.params.imageId])
    await unlinkStoredFile(rows[0].filepath)
    return res.send({ status: "success", message: "Image deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: "error", message: err.message });
  }
});

export default router;