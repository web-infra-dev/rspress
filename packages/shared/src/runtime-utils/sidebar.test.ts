import { describe, expect, test } from '@rstest/core';
import type { NavItemWithLink } from '../types';
import { matchNavbar, matchSidebar } from './sidebar';

describe('matchSidebar', () => {
  test('respects segment boundaries when matching the sidebar key', () => {
    // regression: `/guide` used to claim `/guidelines/setup`
    expect(matchSidebar('/guide', '/guidelines/setup')).toBe(false);
    expect(matchSidebar('/zh/guide', '/zh/guidelines')).toBe(false);
  });

  test('still matches the key itself and nested pages', () => {
    expect(matchSidebar('/guide', '/guide')).toBe(true);
    expect(matchSidebar('/guide', '/guide/setup')).toBe(true);
    expect(matchSidebar('/guide', '/guide/setup/')).toBe(true);
    expect(matchSidebar('/', '/any/page')).toBe(true);
  });

  test('keeps the api-extractor dot boundary', () => {
    expect(matchSidebar('/api/react', '/api/react.use')).toBe(true);
    expect(matchSidebar('/api/react', '/api/reactive.use')).toBe(false);
  });
});

describe('matchNavbar', () => {
  test('root link is only active on the homepage', () => {
    const home: NavItemWithLink = { text: 'Home', link: '/' };
    expect(matchNavbar(home, '/')).toBe(true);
    expect(matchNavbar(home, '/guide/setup')).toBe(false);
  });

  test('respects segment boundaries', () => {
    const guide: NavItemWithLink = { text: 'Guide', link: '/guide' };
    expect(matchNavbar(guide, '/guide/setup')).toBe(true);
    expect(matchNavbar(guide, '/guidebook/en')).toBe(false);
  });

  test('does not compile plain links as regex', () => {
    const cpp: NavItemWithLink = { text: 'C++', link: '/c++/' };
    expect(() => matchNavbar(cpp, '/c++/sdk')).not.toThrow();
    expect(matchNavbar(cpp, '/c++/sdk')).toBe(true);
  });

  test('activeMatch is still treated as a regex', () => {
    const item: NavItemWithLink = {
      text: 'Guide',
      link: '/guide',
      activeMatch: '^/zh/guide',
    };
    expect(matchNavbar(item, '/zh/guide/setup')).toBe(true);
    expect(matchNavbar(item, '/guide/setup')).toBe(false);
  });

  test('an invalid activeMatch falls back to link matching', () => {
    const item: NavItemWithLink = {
      text: 'Guide',
      link: '/guide/',
      activeMatch: '(',
    };
    expect(() => matchNavbar(item, '/guide/setup')).not.toThrow();
    expect(matchNavbar(item, '/guide/setup')).toBe(true);
  });
});
