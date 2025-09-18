import { PageContext, useLocation } from '@rspress/runtime';
import { Layout } from '@theme';
import React, { useContext, useLayoutEffect } from 'react';
import globalComponents from 'virtual-global-components';
import { initPageData } from './initPageData';

const QueryStatus = {
  Show: '1',
  Hide: '0',
} as const;

export function App() {
  const { setData: setPageData, data } = useContext(PageContext);
  const { pathname, search } = useLocation();
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

  // during csr, data can be null because of using useLayoutEffect to update data
  if (!data) {
    return <></>;
  }

  const frontmatter = data.frontmatter || {};
  const GLOBAL_COMPONENTS_KEY = 'globalUIComponents';

  const query = new URLSearchParams(search);
  const hideGlobalUIComponents =
    // Disable global components in frontmatter or query
    frontmatter[GLOBAL_COMPONENTS_KEY] === false ||
    query.get(GLOBAL_COMPONENTS_KEY) === QueryStatus.Hide;

  return (
    <>
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
                ...props,
              });
            }

            return React.createElement(componentInfo, {
              // eslint-disable-next-line react/no-array-index-key
              key: index,
            });
          })
      }
    </>
  );
}
