import app from '../server'
import request from 'supertest'
import fs from 'node:fs'
import path from 'node:path'
import { UPLOAD_DIR } from '../storedFiles.js'
import {
  TINY_PNG,
  unique,
  loginSession,
  signupUser,
  deleteImageById,
  deleteImagesByUsername,
  deleteCategoryById,
  deleteUsersByUsername,
} from './helpers'

describe('images routes', () => {
  const categoryName = unique('itestcat')
  const imageName = unique('itestimg')
  let sessionUser
  let categoryId
  let imageId

  beforeAll(async () => {
    sessionUser = await loginSession()

    const catRes = await sessionUser.post('/api/v1/categories')
      .send({ category: categoryName })
    expect(catRes.status).toBe(200)
    expect(catRes.body.status).toBe('success')

    const cats = await request(app).get('/api/v1/categories')
    categoryId = cats.body.data.categories.find((c) => c.categoryname === categoryName).id

    const up = await sessionUser.post('/api/v1/images')
      .field('img_name', imageName)
      .field('category', categoryId)
      .attach('files', TINY_PNG, 'test-image.png')
    expect(up.status).toBe(200)

    const search = await request(app).get(`/api/v1/images?search=${encodeURIComponent(imageName)}`)
    imageId = search.body.body.find((i) => i.img_name === imageName).id
    expect(imageId).toBeDefined()
  });

  afterAll(async () => {
    await deleteImageById(imageId)
    await deleteCategoryById(categoryId)
  });

  describe('GET /', () => {
    it('returns 400 when no query parameter is provided', async () => {
      const res = await request(app).get('/api/v1/images')
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/random, search or id/)
    });

    it('returns a single random public image', async () => {
      const res = await request(app).get('/api/v1/images?random=true')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('success')
      expect(Array.isArray(res.body.body)).toBe(true)
      expect(res.body.body.length).toBeLessThanOrEqual(1)
    });

    it('finds images by search term', async () => {
      const res = await request(app).get(`/api/v1/images?search=${encodeURIComponent(imageName)}`)
      expect(res.status).toBe(200)
      const hit = res.body.body.find((i) => i.img_name === imageName)
      expect(hit).toBeDefined()
    });

    it('finds a specific image by id', async () => {
      const res = await request(app).get(`/api/v1/images?id=${imageId}`)
      expect(res.status).toBe(200)
      expect(res.body.body.length).toBe(1)
      expect(res.body.body[0].id).toBe(imageId)
    });

    it('returns an empty result for a missing id', async () => {
      const res = await request(app).get('/api/v1/images?id=99999999')
      expect(res.status).toBe(200)
      expect(res.body.body).toEqual([])
    });
  });

  describe('GET /:categoryId', () => {
    it('lists the images inside a category', async () => {
      const res = await request(app).get(`/api/v1/images/${categoryId}`)
      expect(res.status).toBe(200)
      const names = res.body.body.map((i) => i.img_name)
      expect(names).toContain(imageName)
    });

    it('returns an empty result for a missing category', async () => {
      const res = await request(app).get('/api/v1/images/99999999')
      expect(res.status).toBe(200)
      expect(res.body.body).toEqual([])
    });
  });

  describe('POST /', () => {
    it('rejects uploads when not logged in', async () => {
      const res = await request(app).post('/api/v1/images')
        .field('img_name', unique('noauth'))
        .field('category', categoryId)
        .attach('files', TINY_PNG, 'noauth.png')
      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Not logged in')
    });

    it('rejects uploads without a file', async () => {
      const res = await sessionUser.post('/api/v1/images')
        .send({ img_name: unique('nofile'), category: categoryId })
      expect(res.status).toBe(400)
      expect(res.body.message).toBe('No file uploaded')
    });

    it('rejects uploads without an image name', async () => {
      const res = await sessionUser.post('/api/v1/images')
        .field('category', categoryId)
        .attach('files', TINY_PNG, 'noname.png')
      expect(res.status).toBe(400)
      expect(res.body.message).toBe('img_name is required')
    });

    it('rejects uploads into an invalid category', async () => {
      const res = await sessionUser.post('/api/v1/images')
        .field('img_name', unique('badcat'))
        .field('category', 99999999)
        .attach('files', TINY_PNG, 'badcat.png')
      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Invalid category')
    });

    it('uploads a file and returns its metadata', async () => {
      const name = unique('uploadimg')
      const res = await sessionUser.post('/api/v1/images')
        .field('img_name', name)
        .field('category', categoryId)
        .attach('files', TINY_PNG, 'meta.png')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('success')
      expect(res.body.data.name).toBe('meta.png')
      expect(res.body.data.mimetype).toBe('image/png')
      expect(res.body.data.size).toBe(TINY_PNG.length)

      const search = await request(app).get(`/api/v1/images?search=${encodeURIComponent(name)}`)
      const hit = search.body.body.find((i) => i.img_name === name)
      expect(hit).toBeDefined()
      await deleteImageById(hit.id)
    });

    it('rejects a file that is not a supported image', async () => {
      const res = await sessionUser.post('/api/v1/images')
        .field('img_name', unique('notimg'))
        .field('category', categoryId)
        .attach('files', Buffer.from('hello world, this is not an image'), 'fake.png')
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/image files/i)
    });

    it('rejects a file over the 10 MB limit', async () => {
      const res = await sessionUser.post('/api/v1/images')
        .field('img_name', unique('bigimg'))
        .field('category', categoryId)
        .attach('files', Buffer.alloc(10 * 1024 * 1024 + 1), 'big.png')
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/10 MB limit/i)
    });
  });

  describe('PATCH /:imageId', () => {
    it('rejects renaming when not logged in', async () => {
      const res = await request(app).patch(`/api/v1/images/${imageId}`)
        .send({ img_name: unique('noauth') })
      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Not logged in')
    });

    it('rejects renaming without an image name', async () => {
      const res = await sessionUser.patch(`/api/v1/images/${imageId}`).send({})
      expect(res.status).toBe(400)
      expect(res.body.message).toBe('img_name is required')
    });

    it('returns 404 for an image that does not exist', async () => {
      const res = await sessionUser.patch('/api/v1/images/99999999')
        .send({ img_name: unique('missing') })
      expect(res.status).toBe(404)
    });

    it('renames an owned image and updates its timestamp', async () => {
      const newName = unique('renamed')
      const res = await sessionUser.patch(`/api/v1/images/${imageId}`)
        .send({ img_name: newName })
      expect(res.status).toBe(200)
      expect(res.body.body.length).toBe(1)
      expect(res.body.body[0].img_name).toBe(newName)
      expect(typeof res.body.body[0].updated_at).toBe('string')

      const check = await request(app).get(`/api/v1/images?id=${imageId}`)
      expect(check.body.body[0].img_name).toBe(newName)

      // Restore the original name so later tests keep finding it by name.
      await sessionUser.patch(`/api/v1/images/${imageId}`)
        .send({ img_name: imageName })
        .expect(200)
    });

    it('returns 404 when renaming another user\'s image', async () => {
      const username = unique('otheruser')
      const otherName = unique('otherimg')
      await signupUser(username, `${username}@example.com`, 'pass1234')

      let otherSession
      try {
        otherSession = await loginSession(username, 'pass1234')
        const up = await otherSession.post('/api/v1/images')
          .field('img_name', otherName)
          .field('category', categoryId)
          .attach('files', TINY_PNG, 'other.png')
        expect(up.status).toBe(200)

        const search = await request(app).get(`/api/v1/images?search=${encodeURIComponent(otherName)}`)
        const otherImageId = search.body.body.find((i) => i.img_name === otherName).id

        const res = await sessionUser.patch(`/api/v1/images/${otherImageId}`)
          .send({ img_name: unique('stolen') })
        expect(res.status).toBe(404)
      } finally {
        await deleteImagesByUsername(username)
        await deleteUsersByUsername(username)
      }
    });
  });

  describe('DELETE /:imageId', () => {
    it('rejects anonymous deletion with 401', async () => {
      const res = await request(app).delete(`/api/v1/images/${imageId}`)
      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Not logged in')
    });

    it('returns 404 for an image that does not exist', async () => {
      const res = await sessionUser.delete('/api/v1/images/99999999')
      expect(res.status).toBe(404)
    });

    it('returns 404 when deleting another user\'s image', async () => {
      const username = unique('deluser')
      const imgName = unique('delimg')
      await signupUser(username, `${username}@example.com`, 'pass1234')

      let otherSession
      try {
        otherSession = await loginSession(username, 'pass1234')
        const up = await otherSession.post('/api/v1/images')
          .field('img_name', imgName)
          .field('category', categoryId)
          .attach('files', TINY_PNG, 'theirs.png')
        expect(up.status).toBe(200)

        const search = await request(app).get(`/api/v1/images?search=${encodeURIComponent(imgName)}`)
        const theirImageId = search.body.body.find((i) => i.img_name === imgName).id

        const res = await sessionUser.delete(`/api/v1/images/${theirImageId}`)
        expect(res.status).toBe(404)
      } finally {
        await deleteImagesByUsername(username)
        await deleteUsersByUsername(username)
      }
    });

    it('deletes one of your own images (row and file)', async () => {
      const imgName = unique('delownimg')
      const up = await sessionUser.post('/api/v1/images')
        .field('img_name', imgName)
        .field('category', categoryId)
        .attach('files', TINY_PNG, 'own-delete.png')
      expect(up.status).toBe(200)

      const search = await request(app).get(`/api/v1/images?search=${encodeURIComponent(imgName)}`)
      const id = search.body.body.find((i) => i.img_name === imgName).id

      const fileName = path.join(UPLOAD_DIR, String(categoryId), 'own-delete.png')
      expect(fs.statSync(fileName).isFile()).toBe(true)

      const res = await sessionUser.delete(`/api/v1/images/${id}`)
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Image deleted')

      const check = await request(app).get(`/api/v1/images?id=${id}`)
      expect(check.body.body).toEqual([])
      expect(fs.existsSync(fileName)).toBe(false)
    });
  });

  describe('private categories stay private', () => {
    const username = unique('puser')
    const privateImageName = unique('privateimg')
    let userSession
    let privateCategoryId
    let privateImageId

    beforeAll(async () => {
      await signupUser(username, `${username}@example.com`, 'pass1234')
      userSession = await loginSession(username, 'pass1234')

      const cat = await userSession.post('/api/v1/categories')
        .send({ category: unique('privcat'), privacy: true })
      expect(cat.status).toBe(200)

      const cats = await userSession.get('/api/v1/categories')
      const match = cats.body.data.categories.find(
        (c) => c.categoryname === cat.body.data.name && c.private === true
      )
      privateCategoryId = match.id

      const up = await userSession.post('/api/v1/images')
        .field('img_name', privateImageName)
        .field('category', privateCategoryId)
        .attach('files', TINY_PNG, 'private.png')
      expect(up.status).toBe(200)

      // The owner can see their own image via the category listing.
      const listing = await userSession.get(`/api/v1/images/${privateCategoryId}`)
      privateImageId = listing.body.body.find((i) => i.img_name === privateImageName).id
      expect(privateImageId).toBeDefined()
    });

    afterAll(async () => {
      await deleteImageById(privateImageId)
      await deleteCategoryById(privateCategoryId)
      await deleteUsersByUsername(username)
    });

    it('is hidden from anonymous users by id', async () => {
      const res = await request(app).get(`/api/v1/images?id=${privateImageId}`)
      expect(res.status).toBe(200)
      expect(res.body.body).toEqual([])
    });

    it('is hidden from other logged-in users', async () => {
      const res = await sessionUser.get(`/api/v1/images?id=${privateImageId}`)
      expect(res.body.body).toEqual([])
    });

    it('is hidden from anonymous users in the category listing', async () => {
      const res = await request(app).get(`/api/v1/images/${privateCategoryId}`)
      expect(res.status).toBe(200)
      expect(res.body.body).toEqual([])
    });

    it('is not returned by the public random or search endpoints', async () => {
      const random = await request(app).get('/api/v1/images?random=true')
      expect(random.body.body.some((i) => i.id === privateImageId)).toBe(false)

      const search = await request(app)
        .get(`/api/v1/images?search=${encodeURIComponent(privateImageName)}`)
      expect(search.body.body.some((i) => i.id === privateImageId)).toBe(false)
    });

    it('is visible to its owner', async () => {
      const byId = await userSession.get(`/api/v1/images?id=${privateImageId}`)
      expect(byId.body.body.length).toBe(1)
      expect(byId.body.body[0].id).toBe(privateImageId)

      const listing = await userSession.get(`/api/v1/images/${privateCategoryId}`)
      expect(listing.body.body.map((i) => i.id)).toContain(privateImageId)
    });
  });
});