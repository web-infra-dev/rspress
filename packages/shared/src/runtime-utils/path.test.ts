import { describe, expect, test } from '@rstest/core';
import { isPathPrefix, matchNavLink, matchNavItem, matchNavPath } from './path';

describe('isPathPrefix', () => {
  test('matches the prefix itself and nested segments', () => {
    expect(isPathPrefix('/guide/setup', '/guide')).toBe(true);
    expect(isPathPrefix('/guide', '/guide')).toBe(true);
    expect(isPathPrefix('/guide/', '/guide')).toBe(true);
    expect(isPathPrefix('/guide', '/guide/')).toBe(true);
    expect(isPathPrefix('/guide/setup', '/guide/')).toBe(true);
    expect(isPathPrefix('/zh/guide/setup', '/zh/guide')).toBe(true);
  });

  test('respects segment boundaries', () => {
    expect(isPathPrefix('/guidelines/setup', '/guide')).toBe(false);
    expect(isPathPrefix('/zh/guidelines', '/zh/guide')).toBe(false);
    expect(isPathPrefix('/g', '/guide')).toBe(false);
  });

  test('root key matches every pathname', () => {
    expect(isPathPrefix('/', '/')).toBe(true);
    expect(isPathPrefix('/any/page', '/')).toBe(true);
    expect(isPathPrefix('/', '/guide')).toBe(false);
  });
});

describe('matchNavPath', () => {
  test('root link only matches the homepage', () => {
    expect(matchNavPath('/', '/')).toBe(true);
    expect(matchNavPath('/guide/setup', '/')).toBe(false);
  });

  test('matches the link itself and nested segments', () => {
    expect(matchNavPath('/guide', '/guide')).toBe(true);
    expect(matchNavPath('/guide/', '/guide')).toBe(true);
    expect(matchNavPath('/guide/setup', '/guide')).toBe(true);
    expect(matchNavPath('/guide/setup', '/guide/')).toBe(true);
  });

  test('respects segment boundaries', () => {
    expect(matchNavPath('/guidebook', '/guide')).toBe(false);
    expect(matchNavPath('/guides', '/guide')).toBe(false);
  });
});

describe('isPathPrefix edge cases', () => {
  test('handles empty prefixes and case differences', () => {
    expect(isPathPrefix('/guide/setup', '')).toBe(true);
    expect(isPathPrefix('/Guide', '/guide')).toBe(false);
  });
});

describe('matchNavLink', () => {
  test('strips .html and /index added by link normalization', () => {
    // regression: with cleanUrls:false a nav link to a section index
    // became `/guide/index.html`, whose stripped form `/guide/index`
    // never matched the actual routePath `/guide/`, so every page fell
    // into the "Others" bucket of llms.txt.
    expect(matchNavLink('/guide/index.html', '/guide/')).toBe(true);
    expect(matchNavLink('/guide/index.html', '/guide/setup')).toBe(true);
    expect(matchNavLink('/guide/', '/guide/setup')).toBe(true);
    expect(matchNavLink('/guide.html', '/guide')).toBe(true);
  });

  test('respects segment boundaries', () => {
    expect(matchNavLink('/guide', '/guidelines/setup')).toBe(false);
    expect(matchNavLink('/guide', '/guide/setup')).toBe(true);
  });

  test('a root link matches every route', () => {
    expect(matchNavLink('/', '/any/page')).toBe(true);
    expect(matchNavLink('/index.html', '/any/page')).toBe(true);
  });
});

describe('matchNavItem', () => {
  test('matches plain links through matchNavLink', () => {
    expect(
      matchNavItem({ text: 'Guide', link: '/guide' }, '/guide/setup'),
    ).toBe(true);
    expect(
      matchNavItem({ text: 'Guide', link: '/guide' }, '/guidelines/setup'),
    ).toBe(false);
  });

  test('treats activeMatch as a regex', () => {
    expect(
      matchNavItem(
        { text: 'Guide', link: '/guide', activeMatch: '^/zh/guide' },
        '/zh/guide/setup',
      ),
    ).toBe(true);
  });

  test('an invalid activeMatch never matches instead of throwing', () => {
    // regression: nav links used to be compiled as regexes, so a link
    // like /c++/ threw SyntaxError and crashed the build.
    expect(
      matchNavItem({ text: 'C++', link: '/c++/', activeMatch: '(' }, '/c++/'),
    ).toBe(false);
    expect(matchNavItem({ text: 'C++', link: '/c++/' }, '/c++/sdk')).toBe(true);
  });

  test('dropdown items match when any child matches', () => {
    const dropdown = {
      text: 'Docs',
      items: [
        { text: 'A', link: '/a' },
        { text: 'Nested', items: [{ text: 'B', link: '/nested/b' }] },
      ],
    };
    expect(matchNavItem(dropdown, '/a/setup')).toBe(true);
    expect(matchNavItem(dropdown, '/nested/b')).toBe(true);
    expect(matchNavItem(dropdown, '/other')).toBe(false);
  });
});
