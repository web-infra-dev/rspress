import { describe, expect, it } from '@rstest/core';
import { formatBuildReport, type PageSize } from './format';

const bothColumns = { html: true, markdown: true };

describe('formatBuildReport', () => {
  it('should group pages by directory and summarize their raw sizes', () => {
    const report = formatBuildReport(
      [
        { routePath: '/', html: 1500, markdown: 120 },
        { routePath: '/guide/', html: 2500, markdown: 450 },
        { routePath: '/guide/start', html: 500, markdown: 80 },
        { routePath: '/guide/api/config', html: 1250, markdown: 200 },
        { routePath: '/404', html: 750 },
      ],
      bothColumns,
    );

    expect(report).toMatchInlineSnapshot(`
      "Page (raw size)     HTML  Markdown
      /                 6.5 kB   0.85 kB
      ├─ guide/         4.3 kB   0.73 kB
      │  ├─ api/        1.3 kB   0.20 kB
      │  │  └─ config   1.3 kB   0.20 kB
      │  ├─ index       2.5 kB   0.45 kB
      │  └─ start      0.50 kB   0.08 kB
      ├─ index          1.5 kB   0.12 kB
      └─ 404           0.75 kB         -"
    `);
  });

  it('should preserve index pages and routes that are prefixes of other pages', () => {
    expect(
      formatBuildReport(
        [
          { routePath: '/guide', html: 1000 },
          { routePath: '/guide/', html: 2000 },
          { routePath: '/guide/start', html: 3000 },
          { routePath: '/guide/start/advanced', html: 4000 },
          { routePath: '/', html: 5000 },
        ],
        { html: true, markdown: false },
      ),
    ).toMatchInlineSnapshot(`
      "Page (raw size)       HTML
      /                  15.0 kB
      ├─ guide/           9.0 kB
      │  ├─ start/        4.0 kB
      │  │  └─ advanced   4.0 kB
      │  ├─ index         2.0 kB
      │  └─ start         3.0 kB
      ├─ index            5.0 kB
      └─ guide            1.0 kB"
    `);
  });

  it('should omit disabled columns and distinguish missing files from zero bytes', () => {
    expect(
      formatBuildReport(
        [
          { routePath: '/guide/missing', html: 1000 },
          { routePath: '/guide/empty', markdown: 0 },
          { routePath: '/other/missing', html: 500 },
        ],
        { html: false, markdown: true },
      ),
    ).toMatchInlineSnapshot(`
      "Page (raw size)  Markdown
      /                 0.00 kB
      ├─ guide/         0.00 kB
      │  ├─ empty       0.00 kB
      │  └─ missing           -
      └─ other/               -
         └─ missing           -"
    `);
  });

  it('should align multilingual and versioned directory names', () => {
    expect(
      formatBuildReport(
        [
          { routePath: '/zh/v2/指南/开始', html: 1000, markdown: 125 },
          { routePath: '/zh/v2/', html: 2000, markdown: 500 },
          { routePath: '/en/v1/guide/start', html: 3000, markdown: 1000 },
        ],
        bothColumns,
      ),
    ).toMatchInlineSnapshot(`
      "Page (raw size)      HTML  Markdown
      /                  6.0 kB    1.6 kB
      ├─ en/             3.0 kB    1.0 kB
      │  └─ v1/          3.0 kB    1.0 kB
      │     └─ guide/    3.0 kB    1.0 kB
      │        └─ start  3.0 kB    1.0 kB
      └─ zh/             3.0 kB   0.63 kB
         └─ v2/          3.0 kB   0.63 kB
            ├─ 指南/     1.0 kB   0.13 kB
            │  └─ 开始   1.0 kB   0.13 kB
            └─ index     2.0 kB   0.50 kB"
    `);
  });

  it('should sort deterministically regardless of input order', () => {
    const pages: PageSize[] = [
      { routePath: '/zebra', html: 999 },
      { routePath: '/beta/two', html: 1000 },
      { routePath: '/alpha/', html: 1001 },
      { routePath: '/', html: 1 },
      { routePath: '/alpha/one', html: 0 },
      { routePath: '/alpha', html: 10000 },
      { routePath: '/beta/one', html: 99999 },
    ];
    const report = formatBuildReport(pages, bothColumns);

    expect(formatBuildReport([...pages].reverse(), bothColumns)).toBe(report);
    expect(
      formatBuildReport([...pages.slice(3), ...pages.slice(0, 3)], bothColumns),
    ).toBe(report);
    expect(report).toContain('0.00 kB');
    expect(report).toContain('100.0 kB');
  });

  it('should not print a report without pages or enabled columns', () => {
    expect(formatBuildReport([], bothColumns)).toBe('');
    expect(
      formatBuildReport([{ routePath: '/', html: 1000 }], {
        html: false,
        markdown: false,
      }),
    ).toBe('');
  });
});
