import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Auto nav and sidebar test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'auto-nav-sidebar');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should render nav and sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });

    // take the nav
    const nav = await page.$$('.rspress-nav-menu');
    expect(nav?.length).toBe(1);

    // take the sidebar, properly a section or a tag
    const sidebar = await page.$$(
      `.rspress-sidebar .rspress-scrollbar > nav > section,
      .rspress-sidebar .rspress-scrollbar > nav > a`,
    );
    expect(sidebar?.length).toBe(2);
  });

  test('Should load total API Overview correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/api/index.html`, {
      waitUntil: 'networkidle',
    });

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(
      ['Config', 'Client API', 'Commands', 'Single'].join(','),
    );

    const h3 = await page.$$('.overview-group_8f375 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(
      [
        'Basic Config',
        'Theme Config',
        'Front Matter Config',
        'Build Config',
        'Extname Config',
        'Nested',
        'Client API Overview',
        'Runtime API',
        'Components',
        'Commands',
        'Single',
      ].join(','),
    );

    const a = await page.$$('.overview-group_8f375 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(
      [
        'root',
        'logoText',
        'nav',
        'sidebar',
        'builderConfig',
        'Default Config',
        'markdown',
        'markdown.remarkPlugins',
        'Usage',
        'Example',
        'rspress dev',
        'rspress build',
      ].join(','),
    );
  });

  test('Should load subpage API Overview correctly - same name', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/config.html`, {
      waitUntil: 'networkidle',
    });

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(['Config'].join(','));

    const h3 = await page.$$('.overview-group_8f375 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(
      [
        'Basic Config',
        'Theme Config',
        'Front Matter Config',
        'Build Config',
        'Extname Config',
        'Nested',
      ].join(','),
    );

    const a = await page.$$('.overview-group_8f375 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(
      [
        'root',
        'logoText',
        'nav',
        'sidebar',
        'builderConfig',
        'Default Config',
        'markdown',
        'markdown.remarkPlugins',
      ].join(','),
    );
  });

  test('Should load subpage API Overview correctly - index.md', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/client-api/index.html`, {
      waitUntil: 'networkidle',
    });

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(['Client API'].join(','));

    const h3 = await page.$$('.overview-group_8f375 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(['Runtime API', 'Components'].join(','));

    const a = await page.$$('.overview-group_8f375 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(['Usage', 'Example'].join(','));
  });

  test('Sidebar not have same name md/mdx will not navigate', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });
    await page.click('.rspress-scrollbar nav section div');
    expect(page.url()).toBe(`http://localhost:${appPort}/guide/`);
  });

  test('Should load nested subpage API Overview correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/config/nested.html`, {
      waitUntil: 'networkidle',
    });

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(['Nested'].join(','));

    const h3 = await page.$$('.overview-group_8f375 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(['Nested Config'].join(','));

    const a = await page.$$('.overview-group_8f375 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(['Nested H2'].join(','));
  });

  test('Should generate data-context in sidebargroup dom', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/api/index.html`, {
      waitUntil: 'networkidle',
    });

    const sidebarGroups = await page.$$('nav section');
    const contexts1 = await page.evaluate(
      sidebars =>
        sidebars?.map(sidebar => sidebar.getAttribute('data-context')),
      sidebarGroups,
    );

    expect(contexts1.join(',')).toEqual(
      ['config', null, 'client-api'].join(','),
    );

    const sidebarGroupConfig = await page.$$('.rspress-sidebar-group > div');
    const contexts2 = await page.evaluate(
      sidebarGroupConfig =>
        sidebarGroupConfig?.map(sidebarItem =>
          sidebarItem.getAttribute('data-context'),
        ),
      sidebarGroupConfig,
    );
    expect(contexts2?.[2]).toEqual('front-matter');
    expect(contexts2?.[3]).toEqual('config-build');
  });
});
