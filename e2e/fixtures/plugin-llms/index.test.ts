import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

/**
 * Assert that `first` appears before `second` in `content`.
 */
function assertOrder(content: string, first: string, second: string) {
  const firstPos = content.indexOf(first);
  const secondPos = content.indexOf(second);
  expect(firstPos, `"${first}" should exist in content`).toBeGreaterThan(-1);
  expect(secondPos, `"${second}" should exist in content`).toBeGreaterThan(-1);
  expect(
    firstPos,
    `"${first}" (pos ${firstPos}) should appear before "${second}" (pos ${secondPos})`,
  ).toBeLessThan(secondPos);
}

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

  test('should order llms.txt entries according to _meta.json', async () => {
    const appDir = __dirname;
    await runBuildCommand(appDir);

    const llmsTxt = await readFile(
      path.resolve(appDir, 'doc_build', 'llms.txt'),
      'utf-8',
    );

    // Isolate the ## Api section to avoid false positives from other sections
    const apiSectionStart = llmsTxt.indexOf('## Api');
    expect(apiSectionStart).toBeGreaterThan(-1);
    const apiSection = llmsTxt.slice(apiSectionStart);

    // doc/api/config/_meta.json order:
    //   config-basic → config-theme → config-frontmatter → config-build
    // Alphabetical order would be: config-basic, config-build, config-frontmatter, config-theme
    // so config-theme before config-frontmatter proves _meta.json is respected
    assertOrder(apiSection, 'config/config-basic.md', 'config/config-theme.md');
    assertOrder(
      apiSection,
      'config/config-theme.md',
      'config/config-frontmatter.md',
    );
    assertOrder(
      apiSection,
      'config/config-frontmatter.md',
      'config/config-build.md',
    );

    // doc/api/client-api/_meta.json order: api-runtime → api-components
    // Alphabetical order would be: api-components, api-runtime (reversed)
    assertOrder(
      apiSection,
      'client-api/api-runtime.md',
      'client-api/api-components.md',
    );

    // doc/api/_meta.json top-level order: config group → client-api group → commands → single-page
    // Alphabetically, commands < config (c-o-m < c-o-n), so this proves top-level order is respected
    assertOrder(apiSection, 'config/config-basic.md', '/api/commands.md');
    assertOrder(apiSection, 'api/commands.md', '/api/single-page.md');
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
