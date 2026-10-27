import { describe, expect, it, rs } from '@rstest/core';
import { renderToString } from 'react-dom/server';
import { SidebarMenu } from '.';

rs.mock('@rspress/core/runtime', () => ({
  useFrontmatter: () => ({
    frontmatter: {
      outline: true,
      sidebar: true,
    },
  }),
  useI18n: () => (key: string) => key,
  useLocation: () => ({ hash: '', pathname: '/' }),
}));

rs.mock('@rspress/core/theme', () => ({
  IconArrowRight: {},
  IconMenu: {},
  ReadPercent: () => null,
  SvgWrapper: () => null,
  renderInlineMarkdown: () => ({}),
  useActiveAnchor: () => ({ scrolledHeader: undefined }),
  useDynamicToc: () => [],
}));

describe('SidebarMenu', () => {
  it('hides the mobile outline when explicitly disabled by the layout', () => {
    const markup = renderToString(
      <SidebarMenu
        isSidebarOpen={false}
        onIsSidebarOpenChange={() => {}}
        isOutlineOpen={false}
        onIsOutlineOpenChange={() => {}}
        showOutline={false}
      />,
    );

    expect(markup).toContain('<div class="rp-sidebar-menu__right"></div>');
    expect(markup).not.toContain('outlineTitle');
  });
});
