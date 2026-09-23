import { ThemeContext } from '@rspress/core/runtime';
import { type Unhead, UnheadProvider } from '@unhead/react/server';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { StaticRouterProvider } from 'react-router-dom';
import { createServerRouter } from './createServerRouter';

const DEFAULT_THEME = 'light';

export async function render(
  routePath: string,
  head: Unhead,
): Promise<{ appMd: string }> {
  const { router, context } = await createServerRouter(routePath);

  const appMd = await renderToMarkdownString(
    <ThemeContext.Provider value={{ theme: DEFAULT_THEME }}>
      <UnheadProvider value={head}>
        <StaticRouterProvider
          router={router}
          context={context}
          hydrate={false}
        />
      </UnheadProvider>
    </ThemeContext.Provider>,
  );

  return {
    appMd,
  };
}

export { routes } from 'virtual-routes';
