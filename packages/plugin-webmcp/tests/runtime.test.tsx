import { describe, expect, rs, test } from '@rstest/core';
import WebMcpRuntime from '../src/runtime/WebMcpRuntime';

rs.mock('@rspress/core/runtime', () => ({
  pathnameToRouteService: rs.fn(),
  removeBase: rs.fn(),
  routePathToMdPath: rs.fn(),
  useLang: rs.fn(),
  useLocation: rs.fn(),
  useNav: rs.fn(),
  usePage: rs.fn(),
  usePages: rs.fn(),
  useSidebar: rs.fn(),
  useSite: rs.fn(),
  useVersion: rs.fn(),
}));

rs.mock('@rspress/core/theme', () => ({
  useAwaitedLinkNavigate: rs.fn(),
  useDocsSearch: rs.fn(),
}));

describe('WebMcpRuntime', () => {
  test('does not mount runtime tools in unsupported environments', () => {
    expect(
      WebMcpRuntime({
        tools: {
          siteInfo: true,
          listPages: true,
          getPage: true,
          currentPage: true,
          search: true,
          navigate: true,
        },
      }),
    ).toBeNull();
  });
});
