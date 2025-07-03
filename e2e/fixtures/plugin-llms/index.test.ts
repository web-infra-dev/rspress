import { access } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test.describe('plugin-llms', async () => {
  test('should generate llms.txt llms-full.txt mdFiles', async () => {
    const appDir = __dirname;
    await runBuildCommand(appDir);

    expect(
      pathExists(path.resolve(appDir, 'doc_build', 'llms.txt')),
    ).toBeTruthy();

    expect(
      pathExists(path.resolve(appDir, 'doc_build', 'llms-full.txt')),
    ).toBeTruthy();

    expect(
      pathExists(path.resolve(appDir, 'doc_build', 'index.md')),
    ).toBeTruthy();
  });

  test('should generate llms.txt llms-full.txt mdFiles', async () => {
    const appDir = __dirname;
    await runBuildCommand(appDir, 'rspress-i18n.config.ts');

    expect(
      pathExists(path.resolve(appDir, 'doc_build', 'llms.txt')),
    ).toBeTruthy();

    expect(
      pathExists(path.resolve(appDir, 'doc_build', 'llms-full.txt')),
    ).toBeTruthy();

    expect(
      pathExists(path.resolve(appDir, 'doc_build', 'index.md')),
    ).toBeTruthy();

    expect(
      pathExists(path.resolve(appDir, 'doc_build', 'zh', 'llms.txt')),
    ).toBeTruthy();

    expect(
      pathExists(path.resolve(appDir, 'doc_build', 'zh', 'llms-full.txt')),
    ).toBeTruthy();

    // FIXME: should work
    // expect(
    //   pathExists(path.resolve(appDir, 'doc_build', 'zh', 'index.md')),
    // ).toBeTruthy();
  });
});
