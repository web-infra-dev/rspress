import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
});
