import app from '../server'
import session from 'supertest-session'
import request from 'supertest'
import { unique, deleteUsersByUsername } from './helpers'

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
      .send({ username, email: `${unique('other')}@example.com`, password: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('User Already Exists')
  });

  it('rejects an email that is already taken', async () => {
    const res = await request(app).post('/api/v1/users/signup')
      .send({ username: unique('sutest'), email, password: 'x' })
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
    ]
    for (const payload of invalidPayloads) {
      const res = await request(app).post('/api/v1/users/signup').send(payload)
      expect(res.status).toBe(422)
    }
  });
});