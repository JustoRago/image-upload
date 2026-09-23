module.exports = {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['./jest.setup.cjs'],
  globalSetup: './jest.globalSetup.cjs',
  globalTeardown: './jest.globalTeardown.cjs',
  // A single worker: with parallelism, every test file re-runs
  // initializeDatabase() against the freshly-wiped DB, and concurrent
  // CREATE TABLE/INDEX IF NOT EXISTS is not atomic — the race crashed a
  // worker. Serial suites are also calmer (one process, one session store,
  // one rate limiter).
  maxWorkers: 1,
  // The pg-pool-backed session store keeps a handle open after the run;
  // everything relevant has finished by then, so exit as soon as the
  // reporters are done.
  forceExit: true,
};