import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from '@rstest/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const createRspressDir = path.resolve(__dirname, '..');
const cliPath = path.join(createRspressDir, 'dist/index.js');

describe('create-rspress CLI scaffold', () => {
  test('creates a basic project with Rslint as expected', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'create-rspress-'));
    const projectDir = path.join(tempDir, 'rspress-rslint-app');

    try {
      execFileSync(
        process.execPath,
        [
          cliPath,
          '--dir',
          projectDir,
          '--template',
          'basic',
          '--tools',
          'rslint',
          '--override',
        ],
        { cwd: createRspressDir },
      );

      const packageJson = JSON.parse(
        readFileSync(path.join(projectDir, 'package.json'), 'utf8'),
      );
      expect(packageJson.scripts.build).toBe('rspress build');
      expect(packageJson.scripts.dev).toBe('rspress dev');
      expect(packageJson.scripts.lint).toBe('rslint');
      expect(packageJson.devDependencies['@rslint/core']).toBeTruthy();
      expect(packageJson.devDependencies.typescript).toBeTruthy();
      expect(existsSync(path.join(projectDir, 'theme/index.tsx'))).toBe(false);

      const rslintConfig = readFileSync(
        path.join(projectDir, 'rslint.config.ts'),
        'utf8',
      );
      expect(rslintConfig).toContain('js.configs.recommended');
      expect(rslintConfig).toContain('ts.configs.recommended');
      expect(rslintConfig).toContain('reactPlugin.configs.recommended');
      expect(rslintConfig).toContain('reactHooksPlugin.configs.recommended');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('creates an i18n project with English and Chinese docs', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'create-rspress-'));
    const projectDir = path.join(tempDir, 'rspress-i18n-app');

    try {
      execFileSync(
        process.execPath,
        [cliPath, '--dir', projectDir, '--template', 'i18n', '--override'],
        { cwd: createRspressDir },
      );

      const config = readFileSync(
        path.join(projectDir, 'rspress.config.ts'),
        'utf8',
      );
      expect(config).toContain("lang: 'en'");
      expect(config).toContain("lang: 'zh'");
      expect(config).toContain("label: '简体中文'");

      expect(existsSync(path.join(projectDir, 'docs/en/index.md'))).toBe(true);
      expect(existsSync(path.join(projectDir, 'docs/zh/index.md'))).toBe(true);
      expect(existsSync(path.join(projectDir, 'docs/index.md'))).toBe(false);
      expect(existsSync(path.join(projectDir, 'theme/index.tsx'))).toBe(false);
      expect(
        existsSync(path.join(projectDir, 'docs/public/rspress-icon.png')),
      ).toBe(true);

      expect(
        existsSync(
          path.join(projectDir, 'docs/en/guide/use-mdx/code-blocks/meta.md'),
        ),
      ).toBe(true);
      expect(
        existsSync(
          path.join(projectDir, 'docs/zh/guide/use-mdx/code-blocks/meta.md'),
        ),
      ).toBe(true);

      const enNav = JSON.parse(
        readFileSync(path.join(projectDir, 'docs/en/_nav.json'), 'utf8'),
      );
      expect(enNav[0].link).toBe('/guide/start/introduction');

      const zhGettingStarted = readFileSync(
        path.join(projectDir, 'docs/zh/guide/start/getting-started.md'),
        'utf8',
      );
      expect(zhGettingStarted).toContain('# 快速开始');

      const zhHome = readFileSync(
        path.join(projectDir, 'docs/zh/index.md'),
        'utf8',
      );
      // TODO: support frontmatter link autoPrefix
      expect(zhHome).toContain('link: /zh/guide/start/introduction');
      expect(zhHome).not.toContain('link: /guide/start/introduction');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('creates a basic theme project with docs and theme files', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'create-rspress-'));
    const projectDir = path.join(tempDir, 'rspress-basic-theme-app');

    try {
      execFileSync(
        process.execPath,
        [
          cliPath,
          '--dir',
          projectDir,
          '--template',
          'basic-theme',
          '--override',
        ],
        { cwd: createRspressDir },
      );

      expect(existsSync(path.join(projectDir, 'docs/index.md'))).toBe(true);
      expect(existsSync(path.join(projectDir, 'theme/index.tsx'))).toBe(true);
      expect(
        existsSync(path.join(projectDir, 'docs/public/rspress-icon.png')),
      ).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('creates an i18n theme project with multilingual docs and theme files', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'create-rspress-'));
    const projectDir = path.join(tempDir, 'rspress-i18n-theme-app');

    try {
      execFileSync(
        process.execPath,
        [
          cliPath,
          '--dir',
          projectDir,
          '--template',
          'i18n-theme',
          '--override',
        ],
        { cwd: createRspressDir },
      );

      expect(existsSync(path.join(projectDir, 'docs/en/index.md'))).toBe(true);
      expect(existsSync(path.join(projectDir, 'docs/zh/index.md'))).toBe(true);
      expect(existsSync(path.join(projectDir, 'theme/index.tsx'))).toBe(true);
      expect(existsSync(path.join(projectDir, 'theme/env.d.ts'))).toBe(true);
      expect(
        existsSync(path.join(projectDir, 'docs/public/rspress-icon.png')),
      ).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
