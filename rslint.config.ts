import { defineConfig, js, ts } from '@rslint/core';

export default defineConfig([
  {
    ignores: [
      '**/*.d.ts',
      '**/compiled/**',
      '**/dist/**',
      '**/dist-*/**',
      '**/doc_build/**',
      '**/node_modules/**',
      '**/packages/create-rspress/template/rspress.config.ts',
    ],
  },
  js.configs.recommended,
  ts.configs.recommended,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      'no-constant-binary-expression': 'off',
      'no-constant-condition': 'off',
      'no-empty': 'off',
    },
  },
]);
