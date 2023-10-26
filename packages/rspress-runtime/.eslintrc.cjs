module.exports = {
  root: true,
  extends: ['@modern-js'],
  ignorePatterns: [
    'runtime.ts',
    'theme.ts',
    'mdx-rs-loader.cjs',
    'tailwind.config.ts',
    'vitest.config.ts',
  ],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
