import app from '../server'
import request from 'supertest'

describe('images routes', () => {
  it('GET /api/v1/images?random=true returns a success payload', async () => {
    const res = await request(app).get('/api/v1/images?random=true')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(Array.isArray(res.body.body)).toBe(true)
  });

  it('GET /api/v1/images without a query parameter returns 400', async () => {
    const res = await request(app).get('/api/v1/images')
    expect(res.status).toBe(400)
  });
});