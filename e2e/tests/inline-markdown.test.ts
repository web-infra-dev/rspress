import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';
import { getSidebar } from '../utils/getSideBar';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Inline markdown test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'inline-markdown');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should render inline markdown of sidebar correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/inline/index`, {
      waitUntil: 'networkidle',
    });

    const sidebar = await getSidebar(page);
    expect(sidebar?.length).toBe(7);

    const sidebarTexts = await Promise.all(
      sidebar.map(element => element.textContent()),
    );
    expect(sidebarTexts.join(',')).toEqual(
      [
        'index',
        'Class: Component<P, S>',
        'Class: Component<P, S>',
        'bold',
        'emphasis',
        '<foo>',
        '-m <number>',
      ].join(','),
    );

    const sidebarInnerHtml = await Promise.all(
      sidebar.map(element => element.innerHTML()),
    );
    const expectedSidebarInnerHtml = [
      '<span>index</span>',
      '<span>Class: Component&lt;P, S&gt;</span>',
      '<span>Class: Component&lt;P, S&gt;</span>',
      '<span><strong>bold</strong></span>',
      '<span><em>emphasis</em></span>',
      '<span><code>&lt;foo&gt;</code></span>',
      '<span>-m &lt;number&gt;</span>',
    ];
    for (const [index, html] of sidebarInnerHtml.entries()) {
      expect(html).toContain(expectedSidebarInnerHtml[index]);
    }
  });

  test('Should render inline markdown of overview page correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/inline/index`, {
      waitUntil: 'networkidle',
    });

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(
      [
        'Class: Component<P, S>',
        'Class: Component<P, S>',
        'bold',
        'emphasis',
        '<foo>',
        '-m <number>',
      ].join(','),
    );
    const h2InnerHtml = await Promise.all(
      h2.map(element => element.innerHTML()),
    );
    expect(h2InnerHtml.join(',')).toEqual(
      [
        'Class: Component&lt;P, S&gt;',
        'Class: Component&lt;P, S&gt;',
        '<strong>bold</strong>',
        '<em>emphasis</em>',
        '<code>&lt;foo&gt;</code>',
        '-m &lt;number&gt;',
      ].join(','),
    );

    const h3 = await page.$$('.overview-group_8f375 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(
      [
        'Class: Component<P, S>',
        'Class: Component<P, S>',
        'bold',
        'emphasis',
        '<foo>',
        '-m <number>',
      ].join(','),
    );
    const h3InnerHtml = await Promise.all(
      h3.map(element => element.innerHTML()),
    );
    const expectedH3InnerHtml = [
      'Class: Component&lt;P, S&gt;</a>',
      'Class: Component&lt;P, S&gt;</a>',
      '<strong>bold</strong></a>',
      '<em>emphasis</em></a>',
      '<code>&lt;foo&gt;</code></a>',
      '-m &lt;number&gt;</a>',
    ];
    for (const [index, html] of h3InnerHtml.entries()) {
      expect(html).toContain(expectedH3InnerHtml[index]);
    }

    const a = await page.$$('.overview-group_8f375 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(
      [
        'Class: Component<P, S>',
        'Class: Component<P, S>',
        '-m <number>',
        '<foo>',
        'foo <bar> baz',
        'bold',
        'emphasis',
      ].join(','),
    );
    const aInnerHtml = await Promise.all(a.map(element => element.innerHTML()));
    const expectedAInnerHtml = [
      'Class: Component&lt;P, S&gt;',
      'Class: Component&lt;P, S&gt;',
      '-m &lt;number&gt;',
      '<code>&lt;foo&gt;</code>',
      '<code>foo &lt;bar&gt; baz</code>',
      '<strong>bold</strong>',
      '<em>emphasis</em>',
    ];
    for (const [index, html] of aInnerHtml.entries()) {
      expect(html).toContain(expectedAInnerHtml[index]);
    }
  });

  test('Should render inline markdown of aside correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/inline/all`, {
      waitUntil: 'networkidle',
    });

    const asides = await page.$$('.aside-link-text');
    const asidesTexts = await Promise.all(
      asides.map(element => element.textContent()),
    );
    expect(asidesTexts.join(',')).toEqual(
      [
        'Class: Component<P, S>',
        'Class: Component<P, S>',
        '-m <number>',
        '<foo>',
        'foo <bar> baz',
        'bold',
        'emphasis',
      ].join(','),
    );
    const asidesInnerHtml = await Promise.all(
      asides.map(element => element.innerHTML()),
    );
    expect(asidesInnerHtml.join(',')).toEqual(
      [
        'Class: Component&lt;P, S&gt;',
        'Class: Component&lt;P, S&gt;',
        '-m &lt;number&gt;',
        '<code>&lt;foo&gt;</code>',
        '<code>foo &lt;bar&gt; baz</code>',
        '<strong>bold</strong>',
        '<em>emphasis</em>',
      ].join(','),
    );
  });
});
