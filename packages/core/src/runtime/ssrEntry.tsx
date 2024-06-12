import { renderToString } from 'react-dom/server';
import type { PageData } from '@rspress/shared';
import { DataContext, ThemeContext } from '@rspress/runtime';
import { StaticRouter } from '@rspress/runtime/server';
import { App, initPageData } from './App';

const DEFAULT_THEME = 'light';

export async function render(
  pagePath: string,
  helmetContext: object,
): Promise<{ appHtml: string; pageData: PageData }> {
  const initialPageData = await initPageData(pagePath);

  const appHtml = renderToString(
    <ThemeContext.Provider value={{ theme: DEFAULT_THEME }}>
      <DataContext.Provider value={{ data: initialPageData }}>
        <StaticRouter location={pagePath}>
          <App helmetContext={helmetContext} />
        </StaticRouter>
      </DataContext.Provider>
    </ThemeContext.Provider>,
  );

  return {
    appHtml,
    pageData: initialPageData,
  };
}

export { routes } from 'virtual-routes-ssr';
