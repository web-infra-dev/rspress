import { define } from 'rstack';
import skillsJson from './skills.json' with { type: 'json' };

const restrictedVirtualImports = {
  group: ['virtual-*'],
  message: 'Import virtual module values through @rspress/core/runtime.',
};

define.lint(({ globals, js, rstestPlugin, ts }) => [
  {
    ignores: ['**/*.d.ts'],
  },
  js.configs.recommended,
  ts.configs.recommended,
  {
    files: ['packages/core/src/**/*.{ts,tsx}'],
    ignores: ['packages/core/src/runtime/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [restrictedVirtualImports],
        },
      ],
    },
  },
  {
    files: ['packages/core/src/theme/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            restrictedVirtualImports,
            {
              group: ['../..', '../../*'],
              message:
                'Theme components are ejected as standalone units. Import shared code through @rspress/core/theme or @rspress/core/runtime instead of traversing two or more parent directories.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    ...rstestPlugin.configs.recommended,
    rules: {
      ...rstestPlugin.configs.recommended.rules,
      'rstest/no-standalone-expect': [
        'error',
        { additionalTestBlockFunctions: ['test'] },
      ],
    },
  },
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

define.fmt({
  arrowParens: 'avoid',
  ignorePatterns: [
    'skills-lock.yaml',
    // Ignore installed Skills because their formatting may differ from this repository.
    ...Object.keys(skillsJson.skills).map(
      name => `${skillsJson.installDir}/${name}`,
    ),
  ],
  plugins: ['heading-case'],
  singleQuote: true,
  sortPackageJson: true,
});

define.staged({
  '*.{md,mdx,css,less,scss,json,jsonc,json5}': ['rs fmt'],
  '*.{js,jsx,ts,tsx,mts,mjs,cjs}': ['rs lint --fix', 'rs fmt'],
  'package.json': ['pnpm run check-dependency-version'],
});
