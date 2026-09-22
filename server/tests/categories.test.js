import app from '../server'
import request from 'supertest'

describe('categories routes', () => {
  it('GET /api/v1/categories returns the list of public categories', async () => {
    const res = await request(app).get('/api/v1/categories')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(Array.isArray(res.body.data.categories)).toBe(true)
  });
});