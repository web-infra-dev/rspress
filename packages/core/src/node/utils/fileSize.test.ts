import { describe, expect, it } from '@rstest/core';
import { formatFileSize, withFileSizeSummary } from './fileSize';

const summary = {
  environmentName: 'node',
  distPath: 'doc_build',
  assets: [
    { name: 'index.html', size: 1000 },
    { name: 'guide/index.html', size: 2000 },
    { name: 'guide/api/config.html', size: 500 },
    { name: 'guide/start.html', size: 500 },
  ],
  totalSize: 4000,
  totalGzipSize: 800,
};

describe('file size total formatter', () => {
  it('groups the supplied assets by directory, with subtotals and direct files', () => {
    const output = formatFileSize(summary);
    expect(output).toMatchInlineSnapshot(`
      "Output (node): doc_build/ (4 files)
      ├─ guide/ (3 files, 3.0 kB)
      │  ├─ api/ (1 file, 0.50 kB)
      │  └─ (files) (2 files, 2.5 kB)
      └─ (files) (1 file, 1.0 kB)
      Total size (node): 4.0 kB (0.80 kB gzipped)"
    `);
    expect(
      formatFileSize({ ...summary, assets: [...summary.assets].reverse() }),
    ).toBe(output);
  });

  it('uses the callback totals for compression and omits disabled compression', () => {
    expect(formatFileSize({ ...summary, totalGzipSize: 0 })).not.toContain(
      'gzipped',
    );
    expect(
      formatFileSize({ ...summary, totalGzipSize: 0, totalBrotliSize: 600 }),
    ).toContain('Total size (node): 4.0 kB (0.60 kB brotli)');
  });

  it('handles root files, Unicode directories, zero sizes and Windows separators', () => {
    expect(
      formatFileSize({
        ...summary,
        distPath: 'output\\docs',
        assets: [{ name: '指南\\开始.html', size: 0 }],
        totalSize: 0,
        totalGzipSize: 0,
      }),
    ).toContain('└─ 指南/ (1 file, 0.00 kB)');
    expect(
      formatFileSize({
        ...summary,
        assets: [{ name: 'index.html', size: 1000 }],
        totalSize: 1000,
      }),
    ).not.toContain('index.html');
  });

  it('only installs a total callback for the default summary mode', () => {
    const include = (asset: { name: string }) => asset.name.endsWith('.html');
    const options = { detail: false, compressed: false, include };
    expect(withFileSizeSummary(options)).toEqual({
      ...options,
      total: formatFileSize,
    });
    expect(options).not.toHaveProperty('total');
  });

  it.each([
    false,
    true,
    { detail: true },
    { detail: false, total: true },
    { detail: false, total: false },
    { detail: false, total: () => 'custom' },
    { detail: false, diff: true },
  ])('keeps explicit Rsbuild reporting options unchanged: %j', options => {
    expect(withFileSizeSummary(options)).toBe(options);
  });
});
