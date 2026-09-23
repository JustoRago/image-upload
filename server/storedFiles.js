import fs from 'node:fs'
import path from 'node:path'

// Maps a stored DB filepath (`uploads/5/photo.png` or legacy
// `./imagefolder/1/photo.jpg`) to its on-disk relative path.
export function storedFilePath(filepath) {
  if (!filepath) return null
  const cleaned = filepath.replace(/\\/g, '/').replace(/^\.\//, '')
  const relative = cleaned.startsWith('uploads/')
    ? cleaned.replace(/^uploads\//, 'imagefolder/')
    : cleaned
  return path.join(...relative.split('/'))
}

// Best-effort removal of the file behind a stored DB filepath.
export async function unlinkStoredFile(filepath) {
  const diskPath = storedFilePath(filepath)
  if (diskPath) await fs.promises.unlink(diskPath).catch(() => {})
}