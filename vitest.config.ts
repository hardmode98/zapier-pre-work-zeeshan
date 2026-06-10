import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Spin up an in-memory MongoDB and connect Mongoose before each test file.
    setupFiles: ['tests/setup.ts'],
    // Tests boot the app; keep logging quiet via NODE_ENV=test.
    env: { NODE_ENV: 'test' },
    // The in-memory mongod binary download can be slow on a cold first run.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
