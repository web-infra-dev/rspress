import { test, expect, describe } from 'vitest';
import {
  withoutLang,
  withBase,
  withoutBase,
  normalizeHref,
  replaceLang,
  parseUrl,
  normalizePosixPath,
  replaceVersion,
} from '.';

describe('test shared utils', () => {
  test('withoutLang', () => {
    const langs = ['zh', 'en'];
    expect(withoutLang('/zh/guide/', langs)).toBe('/guide/');
  });

  test('withBase', () => {
    expect(withBase('/guide/', '/zh/')).toBe('/zh/guide/');
    expect(withBase('/guide/', '/')).toBe('/guide/');
    expect(withBase('/guide/', '')).toBe('/guide/');
  });

  test('mutiple withBase', () => {
    const base = '/my-base/';
    const firstResult = withBase('/guide/', base);
    const secondResult = withBase(firstResult, base);
    expect(secondResult).toBe('/my-base/guide/');
  });

  test('withoutBase', () => {
    expect(withoutBase('/zh/guide/', '/zh/')).toBe('/guide/');
    expect(withoutBase('/guide/', '/')).toBe('/guide/');
    expect(withoutBase('/guide/', '')).toBe('/guide/');
  });

  test('normalizePosix', () => {
    expect(normalizePosixPath('/guide\\\\start')).toBe('/guide/start');
    expect(normalizePosixPath('/guide//start')).toBe('/guide/start');
    expect(normalizePosixPath('/usr/local/../bin')).toBe('/usr/bin');
    expect(normalizePosixPath('/usr/local/./bin')).toBe('/usr/local/bin');
    expect(normalizePosixPath('/usr/./local/../../bin')).toBe('/bin');
    expect(normalizePosixPath('/')).toBe('/');
    expect(normalizePosixPath('')).toBe('');
  });

  test('normalizeHref', () => {
    expect(normalizeHref()).toEqual('/');
    expect(normalizeHref('/guide/')).toBe('/guide/index.html');
    expect(normalizeHref('/guide')).toBe('/guide.html');
    expect(normalizeHref('/guide/index.html')).toBe('/guide/index.html');
    expect(normalizeHref('/guide/index')).toBe('/guide/index.html');
    expect(normalizeHref('https://example.com/foo')).toBe(
      'https://example.com/foo',
    );
    expect(normalizeHref('mailto:bluth@example.com')).toBe(
      'mailto:bluth@example.com',
    );
    expect(normalizeHref('tel:123456789')).toBe('tel:123456789');
    expect(normalizeHref('/guide', true)).toBe('/guide');
    expect(normalizeHref('/guide/', true)).toBe('/guide/index');
    expect(normalizeHref('/guide.html', true)).toBe('/guide');
    expect(normalizeHref('/guide/index.html', true)).toBe('/guide/index');
    expect(normalizeHref('/guide/version-0.1')).toBe('/guide/version-0.1.html');
    expect(normalizeHref('/guide/version-0.1.html')).toBe(
      '/guide/version-0.1.html',
    );
    expect(normalizeHref('/guide/version-0.1/')).toBe(
      '/guide/version-0.1/index.html',
    );
    expect(normalizeHref('/guide/version-0.1/', true)).toBe(
      '/guide/version-0.1/index',
    );
  });

  describe('replaceLang', () => {
    test('should correctly replace language in the URL', () => {
      const rawUrl = '/v1/index.html';
      const lang = {
        current: 'zh',
        target: 'en',
        default: 'zh',
      };
      const version = {
        current: 'v1',
        default: 'v2',
      };
      const base = '';

      const result = replaceLang(rawUrl, lang, version, base);

      expect(result).toEqual('/v1/en/index.html');
    });

    test('should correctly handle when no version is provided', () => {
      const rawUrl = '/zh/index.html';
      const lang = {
        current: 'zh',
        target: 'en',
        default: 'en',
      };
      const version = {
        current: 'v1',
        default: 'v1',
      };
      const base = '';

      const result = replaceLang(rawUrl, lang, version, base);

      expect(result).toEqual('/index.html');
    });

    test('should correctly handle the url that ends with a slash', () => {
      const rawUrl = '/zh/';
      const lang = {
        current: 'zh',
        target: 'en',
        default: 'en',
      };
      const version = {
        current: 'v1',
        default: 'v1',
      };
      const base = '';

      const result = replaceLang(rawUrl, lang, version, base);

      expect(result).toEqual('/index.html');
    });
  });

  describe('replaceVersion', () => {
    test('should correctly replace version in the URL', () => {
      const rawUrl = '/index.html';
      const version = {
        current: 'v1',
        target: 'v2',
        default: 'v1',
      };
      const expected = '/v2/index.html';

      expect(replaceVersion(rawUrl, version, '')).toBe(expected);
    });

    test('should correctly to the default version', () => {
      const rawUrl = '/v2/index.html';
      const version = {
        current: 'v2',
        target: 'v1',
        default: 'v1',
      };
      const expected = '/index.html';

      expect(replaceVersion(rawUrl, version, '')).toBe(expected);
    });
  });

  test('parseUrl', () => {
    expect(parseUrl('/guide/')).toEqual({
      url: '/guide/',
      hash: '',
    });
    expect(parseUrl('/guide/?a=1')).toEqual({
      url: '/guide/?a=1',
      hash: '',
    });
    expect(parseUrl('/guide/#a=1')).toEqual({
      url: '/guide/',
      hash: 'a=1',
    });
    expect(parseUrl('/guide/?a=1#b=2')).toEqual({
      url: '/guide/?a=1',
      hash: 'b=2',
    });
  });
});
