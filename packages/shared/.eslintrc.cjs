// eslint-disable-next-line import/no-commonjs
module.exports = {
  root: true,
  extends: ['@modern-js-app'],
  ignorePatterns: [
    '**/tests/**/*',
    'vitest.config.ts',
    'logger.d.ts',
    'node-utils.d.ts',
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
};
