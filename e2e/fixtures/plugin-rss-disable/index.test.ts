import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';
import fixture from './fixture.json';

const appDir = __dirname;
const { siteUrl } = fixture;

test.describe('plugin rss test with disable: true', async () => {
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

  test('`blog/bar` should HAVE rss <link> since it is not disabled', async ({
    page,
  }) => {
    await page.goto(`${prefix}blog/bar`, { waitUntil: 'networkidle' });
    const link = page.locator('link[rel="alternate"]', {});
    await expect(link).toHaveCount(1);
  });

  test('`blog/foo` should NOT have rss <link> since it is disabled by exact match', async ({
    page,
  }) => {
    await page.goto(`${prefix}blog/foo`, { waitUntil: 'networkidle' });
    const link = page.locator('link[rel="alternate"]', {});
    await expect(link).toHaveCount(0);
  });

  test('`releases/1.0.0` should NOT have rss <link> since it is disabled by wildcard', async ({
    page,
  }) => {
    await page.goto(`${prefix}releases/1.0.0`, { waitUntil: 'networkidle' });
    const link = page.locator('link[rel="alternate"]', {});
    await expect(link).toHaveCount(0);
  });

  test('should generate feed files but respect disabled paths', async ({
    request,
  }) => {
    // We expect a 200 since the feed channels are enabled globally, but individual items are filtered
    const blogRes = await request.get(`${prefix}rss/blog.xml`);
    expect(blogRes.status()).toBe(200);
    const blogText = await blogRes.text();
    expect(blogText).toContain('/blog/bar');
    expect(blogText).not.toContain('/blog/foo');

    // releases feed is not generated at all because all its items are disabled
    const releasesRes = await request.get(`${prefix}releases/feed.xml`);
    expect(releasesRes.status()).toBe(404);
  });
});
