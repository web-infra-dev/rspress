import { defineConfig, globals, js, ts } from '@rslint/core';

export default defineConfig([
  {
    ignores: [
      '**/*.d.ts',
      '**/compiled/**',
      '**/dist/**',
      '**/dist-*/**',
      '**/doc_build/**',
      '**/node_modules/**',
      '**/packages/create-rspress/template-*/rspress.config.ts',
    ],
  },
  js.configs.recommended,
  ts.configs.recommended,
  {
    files: [
      '**/*.cjs',
      'packages/core/scripts/**/*.mjs',
      'packages/core/tests/config/**/*.{js,mjs}',
      'scripts/**/*.{js,mjs}',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [
      'e2e/fixtures/public-dir/doc/public/test.js',
      'packages/plugin-preview/static/iframe/**/*.js',
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.cjs', 'scripts/skipCI.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.json',
          './scripts/config/tsconfig.json',
          './packages/*/tsconfig*.json',
          './packages/*/tests/tsconfig.json',
          './website/tsconfig.json',
        ],
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      'no-constant-binary-expression': 'off',
    },
  },
]);
