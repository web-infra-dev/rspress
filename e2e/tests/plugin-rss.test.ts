import path from 'node:path';
import { expect, test } from '@playwright/test';
import fixture from '../fixtures/plugin-rss/fixture.json';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../utils/runCommands';

const appDir = path.resolve(__dirname, '../fixtures/plugin-rss');
const { siteUrl } = fixture;

test.describe('plugin rss test', async () => {
  let appPort: number;
  let app: unknown;
  let prefix: string;
  test.beforeAll(async () => {
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
    prefix = `http://localhost:${appPort}${fixture.base}`;
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('`link-rss` should add rss <link> to this page', async ({ page }) => {
    await page.goto(`${prefix}`, { waitUntil: 'networkidle' });

    const link = page.locator('link[rel="alternate"]', {});

    await expect(link.getAttribute('href')).resolves.toBe(
      `${siteUrl}rss/blog.xml`,
    );
  });

  test('should add rss <link> to pages matched', async ({ page }) => {
    await page.goto(`${prefix}blog/foo`, { waitUntil: 'networkidle' });

    const link = page.locator('link[rel="alternate"]', {});

    await expect(link.getAttribute('href')).resolves.toBe(
      `${siteUrl}rss/blog.xml`,
    );
  });

  test('should change output dir if dir is given', async ({ page }) => {
    // for: output.dir, output.type
    await page.goto(`${prefix}releases/feed.xml`, { waitUntil: 'networkidle' });

    const feed = page.locator('feed>id');

    await expect(feed.textContent()).resolves.toBe('releases');
  });

  test('should sort by pubDate by default', async ({ page }) => {
    await page.goto(`${prefix}rss/blog.xml`, { waitUntil: 'networkidle' });

    const all = await page.locator('rss>channel>item').all();
    const allPubDates = await Promise.all(
      all.map(item => item.locator('pubDate').textContent()),
    );
    const sorted = allPubDates
      .slice(0)
      .sort(
        (a, b) => new Date(b || '').getTime() - new Date(a || '').getTime(),
      );
    expect(allPubDates).toEqual(sorted);
  });

  test.describe('rss content', async () => {
    // todo: add more tests for rss content
    test('should has expected content', async ({ page }) => {
      await page.goto(`${prefix}rss/blog.xml`, { waitUntil: 'networkidle' });

      await expect(
        page.locator('rss>channel>title').textContent(),
      ).resolves.toBe(fixture.title);

      await expect(
        page.locator('rss>channel>link').textContent(),
      ).resolves.toBe(fixture.siteUrl);

      const foo = page
        .locator('rss>channel>item')
        // frontmatter.id first
        .filter({ has: page.locator('guid:text-is("foo")') });

      // frontmatter.summary first
      await expect(
        foo.locator("xpath=/*[name()='content:encoded']").textContent(),
      ).resolves.toBe('This is summary\nSecond line of summary\n');

      const bar = page
        .locator('rss>channel>item')
        // frontmatter.slug first
        .filter({ has: page.locator('guid:text-is("bar")') });

      // frontmatter.category first
      await expect(bar.locator('>category').textContent()).resolves.toBe(
        'development',
      );

      // frontmatter.author
      await expect(bar.locator('>author').textContent()).resolves.toBe(
        'lelouch@royal.br (Lamperouge)',
      );
    });
  });
});
