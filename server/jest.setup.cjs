// Ensures the Express app doesn't bind a port or require a real session
// secret default while the test suite is running.
process.env.NODE_ENV = 'test';