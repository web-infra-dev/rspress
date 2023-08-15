// eslint-disable-next-line import/no-commonjs
module.exports = {
  root: true,
  extends: ['@modern-js-app'],
  ignorePatterns: [
    '**/tests/**/*',
    'vitest.config.ts',
    'runtime.ts',
    'theme.ts',
    'config.ts',
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
};
