import app from '../server'
import request from 'supertest'
import {
  TINY_PNG,
  unique,
  loginSession,
  signupUser,
  deleteImageById,
  deleteCategoryById,
  deleteUsersByUsername,
} from './helpers'

describe('categories routes', () => {
  const publicName = unique('pubcat')
  const privateName = unique('privcat')
  let sessionUser
  let publicId
  let privateId
  const createdIds = []

  beforeAll(async () => {
    sessionUser = await loginSession()
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await deleteCategoryById(id)
    }
  });

  it('GET / returns the list of public categories', async () => {
    const res = await request(app).get('/api/v1/categories')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(Array.isArray(res.body.data.categories)).toBe(true)
  });

  describe('POST /', () => {
    it('rejects unauthenticated creation with 401', async () => {
      const res = await request(app).post('/api/v1/categories')
        .send({ category: unique('noauth') })
      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Not logged in')
    });

    it('rejects a blank category name with 422', async () => {
      const res = await sessionUser.post('/api/v1/categories')
        .send({ category: '' })
      expect(res.status).toBe(422)
    });

    it('rejects an overly long category name with 422', async () => {
      const res = await sessionUser.post('/api/v1/categories')
        .send({ category: 'x'.repeat(51) })
      expect(res.status).toBe(422)
    });

    it('creates a public category', async () => {
      const res = await sessionUser.post('/api/v1/categories')
        .send({ category: publicName })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('success')
      expect(res.body.data.name).toBe(publicName)

      const list = await sessionUser.get('/api/v1/categories')
      const match = list.body.data.categories.find((c) => c.categoryname === publicName)
      expect(match).toBeDefined()
      publicId = match.id
      createdIds.push(publicId)
    });

    it('creates a private category', async () => {
      const res = await sessionUser.post('/api/v1/categories')
        .send({ category: privateName, privacy: true })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('success')

      const list = await sessionUser.get('/api/v1/categories')
      const match = list.body.data.categories.find((c) => c.categoryname === privateName)
      expect(match).toBeDefined()
      expect(match.private).toBe(true)
      privateId = match.id
      createdIds.push(privateId)
    });

    it('reports a duplicate public category name with 409', async () => {
      const res = await sessionUser.post('/api/v1/categories')
        .send({ category: publicName })
      expect(res.status).toBe(409)
      expect(res.body.message).toBe('Category already exists')
    });
  });

  describe('category name uniqueness rules', () => {
    const sharedPrivate = unique('sharedpriv')
    const sharedPublic = unique('sharedpub')
    const otherUser = unique('catuser')
    let otherSession
    const createdHere = []

    beforeAll(async () => {
      await signupUser(otherUser, `${otherUser}@example.com`, 'pass1234')
      otherSession = await loginSession(otherUser, 'pass1234')
    });

    afterAll(async () => {
      for (const id of createdHere) {
        await deleteCategoryById(id)
      }
      await deleteUsersByUsername(otherUser)
    });

    // Creates a category and records its id (when created) for cleanup.
    const makeCategory = async (sess, name, privacy) => {
      const res = await sess.post('/api/v1/categories')
        .send({ category: name, privacy })
      if (res.status === 200 && res.body.data?.id) {
        createdHere.push(res.body.data.id)
      }
      return res
    };

    it('allows the same private name for two different users', async () => {
      const a = await makeCategory(sessionUser, sharedPrivate, true)
      expect(a.status).toBe(200)

      const b = await makeCategory(otherSession, sharedPrivate, true)
      expect(b.status).toBe(200)
    });

    it('rejects a private name the same user already uses privately', async () => {
      const res = await makeCategory(sessionUser, sharedPrivate, true)
      expect(res.status).toBe(409)
    });

    it('allows a public category that shares its name with an own private one', async () => {
      const res = await makeCategory(sessionUser, sharedPrivate, false)
      expect(res.status).toBe(200)
    });

    it('rejects a public name already used by another user', async () => {
      const a = await makeCategory(sessionUser, sharedPublic, false)
      expect(a.status).toBe(200)

      const b = await makeCategory(otherSession, sharedPublic, false)
      expect(b.status).toBe(409)
    });

    it('allows a private name that a different user uses publicly', async () => {
      const res = await makeCategory(otherSession, sharedPublic, true)
      expect(res.status).toBe(200)
    });
  });

  describe('visibility of private categories', () => {
    it('hides private categories from anonymous users', async () => {
      const res = await request(app).get('/api/v1/categories')
      expect(res.body.data.categories.find((c) => c.id === privateId)).toBeUndefined()
    });

    it('includes the creator\'s own private categories', async () => {
      const res = await sessionUser.get('/api/v1/categories')
      expect(res.body.data.categories.find((c) => c.id === privateId)).toBeDefined()
    });
  });

  describe('GET /:id', () => {
    it('returns an existing public category', async () => {
      const res = await request(app).get(`/api/v1/categories/${publicId}`)
      expect(res.status).toBe(200)
      expect(res.body.data.category.length).toBe(1)
      expect(res.body.data.category[0].id).toBe(publicId)
    });

    it('returns an empty result for a missing category', async () => {
      const res = await request(app).get('/api/v1/categories/99999999')
      expect(res.status).toBe(200)
      expect(res.body.data.category).toEqual([])
    });

    it('hides a private category from anonymous users', async () => {
      const res = await request(app).get(`/api/v1/categories/${privateId}`)
      expect(res.body.data.category).toEqual([])
    });

    it('shows a private category to its creator', async () => {
      const res = await sessionUser.get(`/api/v1/categories/${privateId}`)
      expect(res.body.data.category.length).toBe(1)
      expect(res.body.data.category[0].id).toBe(privateId)
    });
  });

  describe('PATCH /:id', () => {
    const otherUser = unique('edituer')
    let otherSession

    beforeAll(async () => {
      await signupUser(otherUser, `${otherUser}@example.com`, 'pass1234')
      otherSession = await loginSession(otherUser, 'pass1234')
    });

    afterAll(async () => {
      await deleteUsersByUsername(otherUser)
    });

    it('rejects anonymous edits with 401', async () => {
      const res = await request(app).patch(`/api/v1/categories/${publicId}`)
        .send({ category: unique('x'), privacy: false })
      expect(res.status).toBe(401)
    });

    it('returns 404 for a missing category', async () => {
      const res = await sessionUser.patch('/api/v1/categories/99999999')
        .send({ category: unique('x') })
      expect(res.status).toBe(404)
    });

    it('rejects editing another user\'s category with 403', async () => {
      const res = await otherSession.patch(`/api/v1/categories/${publicId}`)
        .send({ category: unique('x') })
      expect(res.status).toBe(403)
    });

    it('rejects a blank name with 400', async () => {
      const res = await sessionUser.patch(`/api/v1/categories/${publicId}`)
        .send({ category: '   ' })
      expect(res.status).toBe(400)
    });

    it('renames an owned category', async () => {
      const res = await sessionUser.patch(`/api/v1/categories/${publicId}`)
        .send({ category: 'Renamed Category' })
      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Renamed Category')

      const after = await request(app).get(`/api/v1/categories/${publicId}`)
      expect(after.body.data.category[0].categoryname).toBe('Renamed Category')
    });

    it('toggles a category between private and public', async () => {
      const makePrivate = await sessionUser.patch(`/api/v1/categories/${publicId}`)
        .send({ privacy: true })
      expect(makePrivate.status).toBe(200)
      expect(makePrivate.body.data.private).toBe(true)

      // Now private → hidden from anonymous users.
      const anonymous = await request(app).get(`/api/v1/categories/${publicId}`)
      expect(anonymous.body.data.category).toEqual([])

      const makePublic = await sessionUser.patch(`/api/v1/categories/${publicId}`)
        .send({ privacy: false })
      expect(makePublic.body.data.private).toBe(false)

      const visibleAgain = await request(app).get(`/api/v1/categories/${publicId}`)
      expect(visibleAgain.body.data.category[0].id).toBe(publicId)
    });

    it('returns 409 when renaming onto an existing public name', async () => {
      const taken = unique('takenname')
      const created = await sessionUser.post('/api/v1/categories')
        .send({ category: taken })
      expect(created.status).toBe(200)
      const list = await sessionUser.get('/api/v1/categories')
      const takenId = list.body.data.categories.find((c) => c.categoryname === taken).id
      createdIds.push(takenId)

      const res = await sessionUser.patch(`/api/v1/categories/${publicId}`)
        .send({ category: taken })
      expect(res.status).toBe(409)
    });
  });

  describe('DELETE /:id', () => {
    const otherUser = unique('deluser')
    let otherSession

    beforeAll(async () => {
      await signupUser(otherUser, `${otherUser}@example.com`, 'pass1234')
      otherSession = await loginSession(otherUser, 'pass1234')
    });

    afterAll(async () => {
      await deleteUsersByUsername(otherUser)
    });

    it('rejects anonymous deletion with 401', async () => {
      const res = await request(app).delete(`/api/v1/categories/${publicId}`)
      expect(res.status).toBe(401)
    });

    it('returns 404 for a missing category', async () => {
      const res = await sessionUser.delete('/api/v1/categories/99999999')
      expect(res.status).toBe(404)
    });

    it('rejects deleting another user\'s category with 403', async () => {
      const res = await otherSession.delete(`/api/v1/categories/${publicId}`)
      expect(res.status).toBe(403)
    });

    it('blocks deletion while the category contains images', async () => {
      const name = unique('blockedcat')
      const created = await sessionUser.post('/api/v1/categories')
        .send({ category: name })
      expect(created.status).toBe(200)

      const list = await sessionUser.get('/api/v1/categories')
      const id = list.body.data.categories.find((c) => c.categoryname === name).id

      const imgName = unique('img')
      const uploaded = await sessionUser.post('/api/v1/images')
        .field('img_name', imgName)
        .field('category', id)
        .attach('files', TINY_PNG, 'inside.png')
      expect(uploaded.status).toBe(200)

      const res = await sessionUser.delete(`/api/v1/categories/${id}`)
      expect(res.status).toBe(409)
      expect(res.body.message).toMatch(/not empty/i)

      const search = await request(app).get(`/api/v1/images?search=${encodeURIComponent(imgName)}`)
      const imageId = search.body.body.find((i) => i.img_name === imgName)?.id
      await deleteImageById(imageId)
      await deleteCategoryById(id)
    });

    it('deletes an empty category', async () => {
      const name = unique('emptycat')
      const created = await sessionUser.post('/api/v1/categories')
        .send({ category: name })
      expect(created.status).toBe(200)

      const list = await sessionUser.get('/api/v1/categories')
      const id = list.body.data.categories.find((c) => c.categoryname === name).id

      const del = await sessionUser.delete(`/api/v1/categories/${id}`)
      expect(del.status).toBe(200)
      expect(del.body.message).toBe('Category deleted')

      const check = await request(app).get(`/api/v1/categories/${id}`)
      expect(check.body.data.category).toEqual([])
    });
  });
});