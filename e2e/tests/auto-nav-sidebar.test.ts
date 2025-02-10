import path from 'node:path';
import { type ElementHandle, expect, test } from '@playwright/test';
import { getNavbar, getSidebar } from '../utils/getSideBar';
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

    const nav = await getNavbar(page);
    expect(nav?.length).toBe(1);

    const sidebar = await getSidebar(page);
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

    const h3 = await page.$$('.overview-group_f8331 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(
      [
        'Basic config',
        'Theme config',
        'Front matter config',
        'Build config',
        'Extname config',
        'Nested',
        'Runtime API',
        'Components',
        'Commands',
        'Single',
      ].join(','),
    );

    const a = await page.$$('.overview-group_f8331 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(
      [
        'root',
        'logoText',
        'nav',
        'sidebar',
        'builderConfig',
        'Default config',
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
    expect(h2Texts.join(',')).toEqual(
      [
        'Basic config',
        'Theme config',
        'Front matter config',
        'Build config',
        'Extname config',
        'Nested',
      ].join(','),
    );

    const h3 = await page.$$('.overview-group_f8331 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(
      [
        'Basic config',
        'Theme config',
        'Front matter config',
        'Build config',
        'Extname config',
        'Nested config',
      ].join(','),
    );

    const a = await page.$$('.overview-group_f8331 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(
      [
        'root',
        'logoText',
        'nav',
        'sidebar',
        'builderConfig',
        'Default config',
        'markdown',
        'markdown.remarkPlugins',
        'Nested H2',
      ].join(','),
    );
  });

  test('Should load subpage API Overview correctly - index.md', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/client-api.html`, {
      waitUntil: 'networkidle',
    });

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(['Client API'].join(','));

    const h3 = await page.$$('.overview-group_f8331 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(['Runtime API', 'Components'].join(','));

    const a = await page.$$('.overview-group_f8331 ul a');
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

    const h3 = await page.$$('.overview-group_f8331 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(['Nested config'].join(','));

    const a = await page.$$('.overview-group_f8331 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(['Nested H2'].join(','));
  });

  test('Should generate data-context in sidebar group dom', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/index.html`, {
      waitUntil: 'networkidle',
    });

    function getDataContextFromElements(
      elements: ElementHandle<SVGElement | HTMLElement>[],
    ) {
      return page.evaluate(
        sidebars =>
          sidebars?.map(sidebar => sidebar.getAttribute('data-context')),
        elements,
      );
    }

    const sidebarGroupSections = await page.$$('.rspress-sidebar-section');
    const c1 = await getDataContextFromElements(sidebarGroupSections);
    expect(c1.join(',')).toEqual(
      ['config', null, 'client-api', null].join(','),
    );

    const sidebarGroupCollapses = await page.$$('.rspress-sidebar-collapse');
    const c2 = await page.evaluate(
      sidebars =>
        sidebars?.map(sidebar => sidebar.getAttribute('data-context')),
      sidebarGroupCollapses,
    );
    expect(c2.join(',')).toEqual(
      ['config', null, 'client-api', null].join(','),
    );

    const sidebarGroupItems = await page.$$('.rspress-sidebar-item');
    const c3 = await getDataContextFromElements(sidebarGroupItems);
    expect(c3?.[2]).toEqual('front-matter');
    expect(c3?.[3]).toEqual('config-build');

    // custom link should work
    const customLinkItems = await page.$$(
      '[data-context="rspack-official-docsite-custom-link"]',
    );
    const c4 = await Promise.all(customLinkItems.map(i => i.textContent()));

    expect(c4.join(',')).toEqual(
      ['Rspack Official Docsite', 'Inner SideBar Rspack Official Docsite'].join(
        ',',
      ),
    );
  });
});
