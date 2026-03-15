'use client';

import type { PageDataLegacy } from '@rspress/shared';
import React, { useMemo } from 'react';
import { BrowserRouter, StaticRouter } from 'react-router-dom';
import globalComponents from 'virtual-global-components';
import { ThemeContext } from '../hooks/useDark';
import { PageContext } from '../hooks/usePage';
import { removeTrailingSlash, withBase } from '../utils';
import { useThemeState } from '../../theme/logic/useThemeState';

export function RscClientProviders({
  children,
  page,
}: {
  children: React.ReactNode;
  page: PageDataLegacy['page'];
}) {
  const [theme, setTheme] = useThemeState();
  const basename = removeTrailingSlash(withBase('/'));
  const location = withBase(page.routePath || '/');
  const content = (
    <>
      {children}
      {globalComponents.map((componentInfo, index) => {
        if (Array.isArray(componentInfo)) {
          const [component, props] = componentInfo;
          return React.createElement(component, {
            // eslint-disable-next-line react/no-array-index-key
            key: index,
            ...(props as object),
          });
        }

        return React.createElement(componentInfo, {
          // eslint-disable-next-line react/no-array-index-key
          key: index,
        });
      })}
    </>
  );

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
    >
      <PageContext.Provider value={useMemo(() => ({ data: page }), [page])}>
        {typeof document === 'undefined' ? (
          <StaticRouter basename={basename} location={location}>
            {content}
          </StaticRouter>
        ) : (
          <BrowserRouter basename={basename}>{content}</BrowserRouter>
        )}
      </PageContext.Provider>
    </ThemeContext.Provider>
  );
}
