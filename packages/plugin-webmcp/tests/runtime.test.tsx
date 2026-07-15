import { describe, expect, rs, test } from '@rstest/core';
import WebMcpRuntime from '../src/runtime/WebMcpRuntime';

rs.mock('@rspress/core/runtime', () => ({
  pathnameToRouteService: rs.fn(),
  removeBase: rs.fn(),
  routePathToMdPath: rs.fn(),
  useLocation: rs.fn(),
  usePage: rs.fn(),
}));

rs.mock('@rspress/core/theme', () => ({
  useFullTextSearch: rs.fn(),
  useLinkNavigate: rs.fn(),
}));

describe('WebMcpRuntime', () => {
  test('does not mount runtime tools in unsupported environments', () => {
    expect(
      WebMcpRuntime({
        tools: { currentPage: true, search: true, navigate: true },
      }),
    ).toBeNull();
  });
});
