import { access, readFile } from 'node:fs/promises';
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

    // Verify llms.txt content: nav sections should group routes correctly
    const llmsTxt = await readFile(
      path.resolve(appDir, 'doc_build', 'llms.txt'),
      'utf-8',
    );
    // Should have nav-based sections, not everything in "Other"
    expect(llmsTxt).toContain('## Guide');
    expect(llmsTxt).toContain('## Api');
    // Guide routes should be grouped under Guide section
    expect(llmsTxt).toContain('- [Guide](/guide/index.md)');
    // Api routes should be grouped under Api section
    expect(llmsTxt).toContain('- [Commands](/api/commands.md)');

    // Verify llms-full.txt has markdown content with url frontmatter
    const llmsFullTxt = await readFile(
      path.resolve(appDir, 'doc_build', 'llms-full.txt'),
      'utf-8',
    );
    expect(llmsFullTxt).toContain('url: /guide/index.md');
    expect(llmsFullTxt).toContain('url: /api/commands.md');
  });

  test('multiple configuration - should generate llms.txt llms-full.txt mdFiles', async () => {
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

    // Verify zh/llms.txt has Chinese content grouped by nav
    const zhLlmsTxt = await readFile(
      path.resolve(appDir, 'doc_build', 'zh', 'llms.txt'),
      'utf-8',
    );
    expect(zhLlmsTxt).toContain('## Guide');
    expect(zhLlmsTxt).toContain('## Api');
    expect(zhLlmsTxt).toContain('- [安装](/zh/guide/basic/install.md)');

    // FIXME: should work
    // expect(
    //   pathExists(path.resolve(appDir, 'doc_build', 'zh', 'index.md')),
    // ).toBeTruthy();
  });
});
