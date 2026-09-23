import fs from 'node:fs'
import path from 'node:path'

// Directory where uploaded image files live. Defaults to ./imagefolder for the
// dev server and `npm run seed`; the test suite points this at a throwaway temp
// directory so the real image folder is never touched.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './imagefolder'

// Maps a stored DB filepath (`uploads/5/photo.png` or legacy
// `./imagefolder/1/photo.jpg`) to its on-disk path.
export function storedFilePath(filepath) {
  if (!filepath) return null
  const cleaned = filepath.replace(/\\/g, '/').replace(/^\.\//, '')
  const relative = cleaned.replace(/^uploads\//, '').replace(/^imagefolder\//, '')
  return path.join(UPLOAD_DIR, ...relative.split('/'))
}

// Best-effort removal of the file behind a stored DB filepath.
export async function unlinkStoredFile(filepath) {
  const diskPath = storedFilePath(filepath)
  if (diskPath) await fs.promises.unlink(diskPath).catch(() => {})
}