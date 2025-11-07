import { Content } from '@rspress/core/runtime';
import { Layout } from '@theme';
import React from 'react';
import globalComponents from 'virtual-global-components';

export function App() {
  if (process.env.__SSR_MD__) {
    return <Content />;
  }

  return (
    <>
      <Layout />
      {
        // Global UI
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
    </>
  );
}
