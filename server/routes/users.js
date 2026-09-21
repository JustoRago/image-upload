import 'dotenv/config'
import pg from '../db.js'
import express from 'express'
import { body, validationResult } from 'express-validator'
import pgPromise from "pg-promise";

const PQ = pgPromise.ParameterizedQuery

export const loginValidator = [
  body('username', 'Invalid empty username').not().isEmpty(),
  body('password', 'Invalid empty password').not().isEmpty(),
]

export const signupValidator = [
  body('email', 'Invalid does not Empty').not().isEmpty(),
  body('email', 'Invalid email').isEmail(),
  body('username', 'Invalid empty username').not().isEmpty(),
  body('password', 'Invalid empty password').not().isEmpty(),
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
      req.session.user = { username: result[0].username, id: result[0].id };
      return res.send({
        status: "success",
        logged: true,
        user: req.session.user,
      })
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

export default router;