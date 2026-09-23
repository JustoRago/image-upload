import 'dotenv/config'
import pg from '../db.js'
import express from 'express'
import { body, validationResult } from 'express-validator'
import pgPromise from "pg-promise";
import { unlinkStoredFile } from '../storedFiles.js'

const PQ = pgPromise.ParameterizedQuery

export const loginValidator = [
  body('username', 'Invalid empty username').not().isEmpty(),
  body('password', 'Invalid empty password').not().isEmpty(),
]

export const signupValidator = [
  body('email', 'Invalid email').isEmail(),
  body('email', 'Email must be at most 254 characters').isLength({ max: 254 }),
  body('username', 'Username must be 3-30 characters').isLength({ min: 3, max: 30 }).trim(),
  body('password', 'Password must be 6-72 characters').isLength({ min: 6, max: 72 }),
]

const router = express.Router();

const checkIfEmailExists = (email) => {
  const checkEmail = new PQ({ text: `SELECT * FROM users WHERE email = $1`, values: [email] })
  return pg.any(checkEmail).then((result) => result.length > 0);
}

const checkIfUserExists = (username) => {
  const checkUserName = new PQ({ text: `SELECT * FROM users WHERE username = $1`, values: [username] })
  return pg.any(checkUserName).then((result) => result.length > 0);
}

// User Signup Route
router.post('/signup', signupValidator, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  try {
    const invalidUser = await checkIfUserExists(req.body.username)
    if (invalidUser) {
      return res.status(400).json({ message: "User Already Exists" })
    }

    const invalidEmail = await checkIfEmailExists(req.body.email)
    if (invalidEmail) {
      return res.status(400).json({ message: "Email Already Exists" })
    }

    const insertUser = new PQ({
      text: `
        INSERT INTO users (username, created_at, email, password)
        VALUES ($1, current_timestamp, $2, crypt($3, gen_salt('bf')))
      `,
      values: [req.body.username, req.body.email, req.body.password]
    });
    await pg.none(insertUser)
    return res.send({
      status: "success",
      success: true,
      message: "User Created",
    });
  } catch (err) {
    console.error('Error inserting', err);
    return res.status(400).json({ status: "failed", message: err.message });
  }
});

// User Log In Route
router.post('/login', loginValidator, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  try {
    const userExists = await checkIfUserExists(req.body.username)
    if (!userExists) {
      return res.status(400).json({ message: "User Does Not Exist!" })
    }

    const checkPassword = new PQ({
      text: `
        SELECT * FROM users
        WHERE username = $1
          AND password = crypt($2, password);
      `,
      values: [req.body.username, req.body.password]
    });
    const result = await pg.any(checkPassword);
    if (result.length) {
      const user = { username: result[0].username, id: result[0].id };
      // Start a fresh session id on login to prevent session fixation.
      return req.session.regenerate((err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ status: "failed", message: err.message });
        }
        req.session.user = user;
        return res.send({
          status: "success",
          logged: true,
          user,
        })
      });
    }
    return res.status(400).json({ message: "Password Incorrect!" })
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "failed", message: err.message });
  }
});

router.get('/', (req, res) => {
  if (req.session.user) {
    res.send({
      user: req.session.user
    })
  } else {
    res.send({
      valid: false,
      user: null
    })
  }
})

router.delete('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(400).send('Unable to log out')
      } else {
        res.send('Logout successful')
      }
    });
  } else {
    res.end()
  }
})

// PATCH /api/v1/users/password — change the password of the logged-in user
router.patch('/password', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ status: "failed", message: "Not logged in" });
  }
  const { current_password, new_password } = req.body;
  if (typeof new_password !== 'string' || new_password.length < 6 || new_password.length > 72) {
    return res.status(400).json({ status: "failed", message: "New password must be 6-72 characters" });
  }
  try {
    const valid = await pg.any(new PQ({
      text: `SELECT 1 FROM users WHERE id = $1 AND password = crypt($2, password)`,
      values: [req.session.user.id, current_password]
    }));
    if (!valid.length) {
      return res.status(400).json({ status: "failed", message: "Current password is incorrect" });
    }
    await pg.none(new PQ({
      text: `UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE id = $2`,
      values: [new_password, req.session.user.id]
    }));
    return res.send({ status: "success", message: "Password updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "failed", message: err.message });
  }
});

// DELETE /api/v1/users/account — delete the logged-in user and their data
router.delete('/account', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ status: "failed", message: "Not logged in" });
  }
  const userId = req.session.user.id;
  try {
    // Never silently destroy other people's uploads: block while anyone
    // still has images inside this user's categories.
    const hosted = await pg.any(new PQ({
      text: `SELECT 1 FROM images WHERE category IN (SELECT id FROM categories WHERE creator_id = $1) LIMIT 1`,
      values: [userId]
    }));
    if (hosted.length) {
      return res.status(400).json({ status: "failed", message: "Delete all images in your categories first" });
    }

    // Remove the account's own images (rows + files), then their categories.
    const ownImages = await pg.any('SELECT filepath FROM images WHERE upload_id = $1', [userId]);
    await pg.none('DELETE FROM images WHERE upload_id = $1', [userId]);
    for (const img of ownImages) {
      await unlinkStoredFile(img.filepath);
    }
    await pg.none('DELETE FROM categories WHERE creator_id = $1', [userId]);

    // Drop every stored session of this user so the destroyed account can
    // no longer be acted upon.
    await pg.none(`DELETE FROM session WHERE sess::json->'user'->>'id' = $1`, [String(userId)]).catch(() => {});

    await pg.none('DELETE FROM users WHERE id = $1', [userId]);
    return req.session.destroy(() => res.send({ status: "success", message: "Account deleted" }));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "failed", message: err.message });
  }
});

export default router;