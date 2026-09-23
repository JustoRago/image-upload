// Runs once in the main jest process after the whole suite finishes. Removes
// the throwaway upload folder so no test files leak into the working tree.
// (The test database itself is wiped again by the next run's globalSetup.)
require('dotenv').config()
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

module.exports = async function globalTeardown() {
  fs.rmSync(path.join(os.tmpdir(), 'image-upload-tests'), { recursive: true, force: true })
}