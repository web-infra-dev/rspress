import { describe, expect, it, rs } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { Content } from './Content';
import { ContentSourceContext } from './ContentSourceContext';

const routeContentMock = rs.fn(({ pathname }: { pathname: string }) => (
  <div data-pathname={pathname}>route-content</div>
));

rs.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/guide/',
  }),
}));

rs.mock('./RouteContent', () => ({
  RouteContent: routeContentMock,
}));

describe('Content', () => {
  it('renders injected content source first', () => {
    const html = renderToStaticMarkup(
      <ContentSourceContext.Provider value={<div>injected-content</div>}>
        <Content />
      </ContentSourceContext.Provider>,
    );

    expect(html).toContain('injected-content');
    expect(routeContentMock).not.toHaveBeenCalled();
  });

  it('falls back to route content when no content source is provided', () => {
    routeContentMock.mockClear();

    const html = renderToStaticMarkup(<Content />);

    expect(html).toContain('route-content');
    expect(routeContentMock).toHaveBeenCalledTimes(1);
    expect(routeContentMock.mock.calls[0]?.[0]).toMatchObject({
      pathname: '/guide/',
      routeProps: undefined,
    });
  });
});
