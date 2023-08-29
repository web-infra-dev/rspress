module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: [
    'packages/cli/bin/rspress.js',
    'vitest.config.ts',
    'playwright.config.ts',
    '**/*.test.ts',
    'e2e/**',
    './scripts/**',
  ],
};
