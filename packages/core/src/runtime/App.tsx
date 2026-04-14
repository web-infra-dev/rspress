import { PageContext, useLocation } from '@rspress/core/runtime';
import { Layout, Root } from '@theme';
import React, { useContext } from 'react';
import globalComponents from 'virtual-global-components';

enum QueryStatus {
  Show = '1',
  Hide = '0',
}

export function App() {
  const { data } = useContext(PageContext);
  const { search } = useLocation();

  // during csr, data can be null because of router loading boundaries
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

  if (process.env.__SSR_MD__) {
    return (
      <Root>
        <Layout />
      </Root>
    );
  }

  return (
    <Root>
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
    </Root>
  );
}
