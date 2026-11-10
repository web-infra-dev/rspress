import path from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { resolveHtmlFilePath, routePath2HtmlFileName } from './htmlFile';

describe('SSG html file helpers', () => {
  it('should convert route path to html file name', () => {
    expect(routePath2HtmlFileName('/')).toBe('index.html');
    expect(routePath2HtmlFileName('/guide/')).toBe('guide/index.html');
    expect(routePath2HtmlFileName('/guide/start')).toBe('guide/start.html');
  });

  it('should resolve html file path inside dist path', () => {
    const distPath = path.resolve('dist');
    expect(resolveHtmlFilePath(distPath, '/guide/')).toBe(
      path.join(distPath, 'guide', 'index.html'),
    );
  });

  it('should reject html file path outside dist path', () => {
    const distPath = path.resolve('dist');
    expect(() => resolveHtmlFilePath(distPath, '../outside')).toThrow(
      'resolves outside of the output directory',
    );
  });
});
