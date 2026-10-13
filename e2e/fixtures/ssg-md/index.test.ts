import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test('llms should be enabled by default', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir);

  const docBuildDir = path.join(appDir, 'doc_build');
  const files = [
    'llms.txt',
    'index.md',
    'components.md',
    'tsx-page.md',
    'llms-full.txt',
  ];

  for (const file of files) {
    const filePath = path.join(docBuildDir, file);
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size <= 0) {
      throw new Error(`Expected non-empty file: ${filePath}`);
    }
  }

  const llmsFullTxt = await fs.readFile(
    path.join(docBuildDir, 'llms-full.txt'),
    'utf-8',
  );
  expect(llmsFullTxt).toContain('url: https://example.com/docs/index.md');

  const llmsTxt = await fs.readFile(
    path.join(docBuildDir, 'llms.txt'),
    'utf-8',
  );
  expect(llmsTxt).toContain('# Rspress SSG MDX Test');
  expect(llmsTxt).toContain('## Others');
  expect(llmsTxt).toContain(
    '- [MDX and React components](https://example.com/docs/components.md)',
  );
  expect(llmsTxt).toContain(
    '- [tsx-page](https://example.com/docs/tsx-page.md)',
  );

  const indexMd = await fs.readFile(
    path.join(docBuildDir, 'index.md'),
    'utf-8',
  );
  expect(
    indexMd
      .trimStart()
      .startsWith(
        '> For AI agents: the complete documentation index is available at https://example.com/docs/llms.txt, the full documentation bundle is available at https://example.com/docs/llms-full.txt.',
      ),
  ).toBeTruthy();
  expect(indexMd).toContain(
    '[MDX and React components](https://example.com/docs/components.md)',
  );

  const indexHtml = await fs.readFile(
    path.join(docBuildDir, 'index.html'),
    'utf-8',
  );
  const hintHtml = indexHtml.match(
    /<div[^>]*class="rp-llms-hint"[\s\S]*?<\/div>/,
  )?.[0];
  if (!hintHtml) {
    throw new Error('Expected llms directive hint in index.html');
  }
  expect(hintHtml).toMatch(/clip:rect\(0, ?0, ?0, ?0\)/);
  expect(hintHtml).not.toContain('display:none');
  expect(hintHtml).not.toContain('hidden=""');
  expect(hintHtml).not.toContain('aria-hidden="true"');
  expect(hintHtml).not.toContain('<a ');
  expect(hintHtml).toContain(
    'For AI agents: the complete documentation index is available at https://example.com/docs/llms.txt, the full documentation bundle is available at https://example.com/docs/llms-full.txt, and this page is available as Markdown at https://example.com/docs/index.md.',
  );
});

test('custom llms.txt renderer should be successful', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir, 'rspress-custom-llms-txt.config.ts');

  const llmsTxt = await fs.readFile(
    path.join(appDir, 'doc_build', 'llms.txt'),
    'utf-8',
  );
  expect(llmsTxt).toContain('# Custom Rspress SSG MDX Test');
  expect(llmsTxt).toContain('> Rspress SSG MDX Test Description');
  expect(llmsTxt).toContain('- Language: en');
  expect(llmsTxt).toContain('- Version: default');
  expect(llmsTxt).toContain('- Base: /docs/');
  expect(llmsTxt).toContain('- Site origin: https://example.com');
  expect(llmsTxt).toContain('## Docs');
  expect(llmsTxt).toContain(
    '- [MDX and React components](https://example.com/docs/components.md) (/components, en, default)',
  );
  expect(llmsTxt).toContain(
    '- [tsx-page](https://example.com/docs/tsx-page.md) (/tsx-page, en, default)',
  );
});

test('csr should be successful', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir, 'rspress-csr.config.ts');

  const files = await fs.readdir(path.join(appDir, 'doc_build'));
  expect(files).not.toContain('llms.txt');
  expect(files).not.toContain('llms-full.txt');
  expect(files).not.toContain('index.md');
});

for (const { ssg, llms, config } of [
  { ssg: true, llms: false, config: 'rspress-ssg-only.config.ts' },
  { ssg: false, llms: true, config: 'rspress-llms-only.config.ts' },
]) {
  test(`ssg: ${ssg}, llms: ${llms} should render independently`, async ({
    page,
  }) => {
    const appDir = import.meta.dirname;
    await runBuildCommand(appDir, config);

    const docBuildDir = path.join(appDir, 'doc_build');
    const html = await fs.readFile(
      path.join(docBuildDir, 'index.html'),
      'utf-8',
    );
    expect(html.includes('<div id="__rspress_root"></div>')).toBe(!ssg);
    expect(html.includes('Rspress uses')).toBe(ssg);

    const files = await fs.readdir(docBuildDir);
    for (const file of ['index.md', 'llms.txt', 'llms-full.txt']) {
      expect(files.includes(file)).toBe(llms);
    }
    if (llms) {
      const markdown = await fs.readFile(
        path.join(docBuildDir, 'index.md'),
        'utf-8',
      );
      expect(markdown).toContain('Rspress uses');
      expect(markdown.trimStart()).toMatch(/^> For AI agents:/);
    }

    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (/hydrate|hydration|Minified React error/i.test(message.text())) {
        errors.push(message.text());
      }
    });

    const port = await getPort();
    const app = await runPreviewCommand(appDir, port, ['-c', config]);
    try {
      await page.goto(`http://localhost:${port}/docs/`, {
        waitUntil: 'networkidle',
      });
      await expect(
        page.getByRole('heading', { name: 'Code blocks', exact: true }),
      ).toBeVisible();
      await page
        .locator('.rspress-doc')
        .getByRole('link', {
          name: 'MDX and React components',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('heading', {
          name: 'MDX and React components',
          exact: true,
        }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await killProcess(app);
    }
  });
}

test('llms directive hint should be configurable', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir, 'rspress-no-llms-hint.config.ts');

  const indexHtml = await fs.readFile(
    path.join(appDir, 'doc_build', 'index.html'),
    'utf-8',
  );
  expect(indexHtml).not.toContain('For AI agents:');
});
