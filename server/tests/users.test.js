import app from '../server'
import session from 'supertest-session'
import request from 'supertest'
import {
  TINY_PNG,
  unique,
  loginSession,
  signupUser,
  deleteImagesByUsername,
  deleteCategoryById,
  deleteUsersByUsername,
} from './helpers'

let testSession = null;

beforeEach(function () {
  testSession = session(app);
});

it('should sign in', function (done) {
  testSession.post('/api/v1/users/login')
    .send({ username: 'asdt560', password: 'justojose1' })
    .expect(200)
    .end(done);
});

describe('after login', function () {

  let authenticatedSession;

  beforeEach(function (done) {
    testSession.post('/api/v1/users/login')
      .send({ username: 'asdt560', password: 'justojose1' })
      .expect(200)
      .end(function (err) {
        if (err) return done(err);
        authenticatedSession = testSession;
        return done();
      });
  });

  it('should check user', async function () {
    let res = await authenticatedSession.get('/api/v1/users/')
      .expect(200)
    // Only the username is fixed by the test fixture; the id depends on the
    // local database and must not be hard-coded.
    await expect(res.body.user.username).toEqual('asdt560')
    await expect(typeof res.body.user.id).toEqual('number')
  });

  it('should log out', async function () {
    let res = await authenticatedSession.delete('/api/v1/users/logout')
      .expect(200)
    await expect(res.text).toEqual("Logout successful")
  })

});

describe('GET /api/v1/users/', () => {
  it('reports no user when the caller is not logged in', async () => {
    const res = await request(app).get('/api/v1/users/')
    expect(res.status).toBe(200)
    expect(res.body.valid).toBe(false)
    expect(res.body.user).toBeNull()
  });
});

describe('DELETE /api/v1/users/logout', () => {
  it('logs out cleanly even without an active session', async () => {
    const res = await request(app).delete('/api/v1/users/logout')
    expect(res.status).toBe(200)
    expect(res.text).toBe('Logout successful')
  });
});

describe('POST /api/v1/users/login', () => {
  it('rejects an unknown username', async () => {
    const res = await request(app).post('/api/v1/users/login')
      .send({ username: 'no-such-user-xyz', password: 'whatever' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('User Does Not Exist!')
  });

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/v1/users/login')
      .send({ username: 'asdt560', password: 'definitely-wrong' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Password Incorrect!')
  });

  it('rejects empty credentials with 422', async () => {
    const res = await request(app).post('/api/v1/users/login').send({})
    expect(res.status).toBe(422)
  });
});

describe('POST /api/v1/users/signup', () => {
  const username = unique('sutest')
  const email = `${username}@example.com`

  afterAll(async () => {
    await deleteUsersByUsername(username)
  });

  it('creates an account that can immediately log in', async () => {
    const res = await request(app).post('/api/v1/users/signup')
      .send({ username, email, password: 'testpass123' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.message).toBe('User Created')

    const login = await request(app).post('/api/v1/users/login')
      .send({ username, password: 'testpass123' })
    expect(login.status).toBe(200)
    expect(login.body.logged).toBe(true)
    expect(login.body.user.username).toBe(username)
  });

  it('rejects a username that is already taken', async () => {
    const res = await request(app).post('/api/v1/users/signup')
      .send({ username, email: `${unique('other')}@example.com`, password: 'validpass1' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('User Already Exists')
  });

  it('rejects an email that is already taken', async () => {
    const res = await request(app).post('/api/v1/users/signup')
      .send({ username: unique('sutest'), email, password: 'validpass1' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Email Already Exists')
  });

  it('rejects invalid signup payloads with 422', async () => {
    const invalidPayloads = [
      {},
      { username, email: 'not-an-email', password: 'x' },
      { username, email },
      { email, password: 'x' },
      { username, email, password: '' },
      { username: 'ab', email, password: 'validpass' },
      { username, email, password: '12345' },
      { username: 'x'.repeat(31), email, password: 'validpass' },
    ]
    for (const payload of invalidPayloads) {
      const res = await request(app).post('/api/v1/users/signup').send(payload)
      expect(res.status).toBe(422)
    }
  });
});

describe('PATCH /api/v1/users/password', () => {
  const username = unique('pwduser')
  const email = `${username}@example.com`
  const oldPassword = 'oldpass123'
  const newPassword = 'newpass456'
  let authSession

  beforeAll(async () => {
    await signupUser(username, email, oldPassword)
    authSession = await loginSession(username, oldPassword)
  });

  afterAll(async () => {
    await deleteUsersByUsername(username)
  });

  it('rejects the change when not logged in', async () => {
    const res = await request(app).patch('/api/v1/users/password')
      .send({ current_password: oldPassword, new_password: newPassword })
    expect(res.status).toBe(401)
  });

  it('rejects a wrong current password', async () => {
    const res = await authSession.patch('/api/v1/users/password')
      .send({ current_password: 'wrong-current', new_password: newPassword })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Current password is incorrect')
  });

  it('rejects a too-short new password', async () => {
    const res = await authSession.patch('/api/v1/users/password')
      .send({ current_password: oldPassword, new_password: '123' })
    expect(res.status).toBe(400)
  });

  it('updates the password and invalidates the old one', async () => {
    const res = await authSession.patch('/api/v1/users/password')
      .send({ current_password: oldPassword, new_password: newPassword })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Password updated')

    const oldLogin = await request(app).post('/api/v1/users/login')
      .send({ username, password: oldPassword })
    expect(oldLogin.status).toBe(400)

    const newLogin = await request(app).post('/api/v1/users/login')
      .send({ username, password: newPassword })
    expect(newLogin.status).toBe(200)
    expect(newLogin.body.logged).toBe(true)
  });
});

describe('DELETE /api/v1/users/account', () => {
  it('rejects the deletion when not logged in', async () => {
    const res = await request(app).delete('/api/v1/users/account')
    expect(res.status).toBe(401)
  });

  it('blocks deletion while a category still contains images', async () => {
    const username = unique('acctuser')
    const email = `${username}@example.com`
    const password = 'pass1234'
    await signupUser(username, email, password)
    const authSession = await loginSession(username, password)

    const cat = await authSession.post('/api/v1/categories')
      .send({ category: unique('acctcat') })
    const cats = await authSession.get('/api/v1/categories')
    const categoryId = cats.body.data.categories.find(
      (c) => c.categoryname === cat.body.data.name
    ).id

    await authSession.post('/api/v1/images')
      .field('img_name', unique('acctimg'))
      .field('category', categoryId)
      .attach('files', TINY_PNG, 'acct.png')
      .expect(200)

    const res = await authSession.delete('/api/v1/users/account')
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/categories first/i)

    // Clean up so the account can be removed.
    await deleteImagesByUsername(username)
    await deleteCategoryById(categoryId)
    await deleteUsersByUsername(username)
  });

  it('deletes the account and revokes its login', async () => {
    const username = unique('goneuser')
    const email = `${username}@example.com`
    const password = 'pass1234'
    await signupUser(username, email, password)
    const authSession = await loginSession(username, password)

    const res = await authSession.delete('/api/v1/users/account')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Account deleted')

    const login = await request(app).post('/api/v1/users/login')
      .send({ username, password })
    expect(login.status).toBe(400)
    expect(login.body.message).toBe('User Does Not Exist!')
  });
});