import { describe, expect, it, rs } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { SidebarItemRaw } from './SidebarItem';

rs.mock('@rspress/core/runtime', () => ({
  useActiveMatcher: () => () => false,
}));

rs.mock('@rspress/core/theme', () => ({
  Link: ({
    children,
    className,
    href,
  }: {
    children: React.ReactNode;
    className?: string;
    href: string;
  }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
  renderInlineMarkdown: (text: string) => ({ children: text }),
  SvgWrapper: ({ className, icon }: { className?: string; icon: string }) => (
    <span className={className} data-icon={icon} />
  ),
  Tag: ({ tag }: { tag?: string }) => (tag ? <span data-tag={tag} /> : null),
}));

describe('SidebarItemRaw', () => {
  it('renders the icon before the text and the tag on the right', () => {
    const markup = renderToStaticMarkup(
      <SidebarItemRaw
        active={false}
        depth={0}
        icon="🚀"
        link="/guide"
        tag="experimental"
        text="Guide"
      />,
    );

    const iconIndex = markup.indexOf('data-icon="🚀"');
    const textIndex = markup.indexOf('>Guide</span>');
    const tagIndex = markup.indexOf('data-tag="experimental"');

    expect(iconIndex).toBeGreaterThan(-1);
    expect(textIndex).toBeGreaterThan(iconIndex);
    expect(tagIndex).toBeGreaterThan(textIndex);
  });
});
