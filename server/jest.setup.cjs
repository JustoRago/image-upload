// Test isolation. Runs in every jest worker before any test file is loaded,
// so this must be set before the app modules (db.js, server.js) are imported.
//
// - NODE_ENV=test keeps the Express app from binding a port.
// - DBNAME is pointed at a dedicated test database (default: dev DB name +
//   '_test') so the suite never touches local dev data.
// - UPLOAD_DIR points at a throwaway temp folder so no test uploads land in
//   the real ./imagefolder.
require('dotenv').config()
const os = require('node:os')
const path = require('node:path')

process.env.NODE_ENV = 'test'
process.env.DBNAME = process.env.TEST_DBNAME || `${process.env.DBNAME || 'image_upload'}_test`
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'image-upload-tests')