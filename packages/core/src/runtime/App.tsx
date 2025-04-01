import { DataContext, useLocation } from '@rspress/runtime';
import { Layout } from '@theme';
import React, { useContext, useLayoutEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import globalComponents from 'virtual-global-components';
import 'virtual-global-styles';
import { initPageData } from './initPageData';

enum QueryStatus {
  Show = '1',
  Hide = '0',
}

export function App({ helmetContext }: { helmetContext?: object }) {
  const { setData: setPageData, data } = useContext(DataContext);
  const frontmatter = data.page.frontmatter || {};
  const { pathname, search } = useLocation();
  const query = new URLSearchParams(search);
  const GLOBAL_COMPONENTS_KEY = 'globalUIComponents';
  const hideGlobalUIComponents =
    // Disable global components in frontmatter or query
    frontmatter[GLOBAL_COMPONENTS_KEY] === false ||
    query.get(GLOBAL_COMPONENTS_KEY) === QueryStatus.Hide;
  useLayoutEffect(() => {
    async function refetchData() {
      try {
        const pageData = await initPageData(pathname);
        setPageData?.(pageData);
      } catch (e) {
        console.log(e);
      }
    }
    refetchData();
  }, [pathname, setPageData]);

  return (
    <HelmetProvider context={helmetContext}>
      <Layout />
      {
        // Global UI
        !hideGlobalUIComponents &&
          globalComponents.map((componentInfo, index) => {
            if (Array.isArray(componentInfo)) {
              const [component, props] = componentInfo;
              return React.createElement(component, {
                // The component order is stable
                // eslint-disable-next-line react/no-array-index-key
                key: index,
                // FIXME: ` as object` should be omitted, seems like `@microsoft/api-extractor` issue
                ...(props as object),
              });
            }

            return React.createElement(componentInfo, {
              // eslint-disable-next-line react/no-array-index-key
              key: index,
            });
          })
      }
    </HelmetProvider>
  );
}
