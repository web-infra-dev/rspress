import { describe, expect, it, rs } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { Tag } from './index';

rs.mock('@rspress/core/runtime', () => ({
  isDataUrl: (url: string) => url.startsWith('data:'),
  isExternalUrl: (url: string) => /^https?:\/\//.test(url),
  normalizeImagePath: (url: string) =>
    url.startsWith('/') ? `/base${url}` : url,
}));

rs.mock('@rspress/core/theme', () => ({
  Badge: ({
    children,
    text,
    type,
  }: {
    children?: React.ReactNode;
    text?: string;
    type?: string;
  }) => (
    <span data-badge-type={type} data-text={text}>
      {children}
    </span>
  ),
  IconDeprecated: 'deprecated-icon',
  IconExperimental: 'experimental-icon',
  SvgWrapper: ({ icon }: { icon: string }) => <span data-icon={icon} />,
  Tag: ({ tag }: { tag?: string }) => <span data-tag={tag}>{tag}</span>,
}));

describe('Tag', () => {
  it('renders inline svg strings before splitting comma-separated tags', () => {
    const markup = renderToStaticMarkup(
      <Tag tag='<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" transform="translate(0, 0)" stroke="white"><text x="0" y="15">test</text></svg>' />,
    );

    expect(markup).toContain('<svg');
    expect(markup).toContain('transform="translate(0, 0)"');
  });

  it('renders public folder image paths as images', () => {
    const markup = renderToStaticMarkup(<Tag tag="/my.svg" />);

    expect(markup).toContain('<img');
    expect(markup).toContain('src="/base/my.svg"');
  });

  it('keeps rendering multiple common tags separated by commas', () => {
    const markup = renderToStaticMarkup(<Tag tag="new, experimental" />);

    expect(markup).toContain('data-tag="new"');
    expect(markup).toContain('data-tag="experimental"');
  });
});
