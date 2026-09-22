import app from '../server'
import request from 'supertest'
import { unique, loginSession, deleteCategoryById } from './helpers'

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

    it('reports a duplicate category name', async () => {
      const res = await sessionUser.post('/api/v1/categories')
        .send({ category: publicName })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('failed')
      expect(res.body.message).toBe('Category already exists')
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
});