import { PageContext, useLocation } from '@rspress/core/runtime';
import {
  Layout,
  LlmsHint,
  Root,
  useWebMcpSiteInfo,
  useWebMcpPageList,
  useWebMcpNavigation,
  useWebMcpPageReading,
} from '@rspress/core/theme';
import React, { useContext } from 'react';
import { useGlobalComponents } from './hooks/useGlobalComponents';

enum QueryStatus {
  Show = '1',
  Hide = '0',
}
const GLOBAL_COMPONENTS_KEY = 'globalUIComponents';

const WebMcpPageReading = () => {
  useWebMcpPageReading();
  return null;
};
const WebMCP = () => {
  useWebMcpSiteInfo();
  useWebMcpPageList();
  useWebMcpNavigation();
  return import.meta.env.ENABLE_SSG_MD ? <WebMcpPageReading /> : null;
};

export function App() {
  const globalComponents = useGlobalComponents();
  const { data } = useContext(PageContext);
  const location = useLocation();
  const { search } = location;

  // This build-time condition is constant for the lifetime of the app.
  // Keep site-wide tools alongside the app's page, navigation and sidebar context.
  const renderWebMcp = import.meta.env.ENABLE_WEBMCP && !import.meta.env.SSR;

  const hideGlobalUIComponents =
    data?.frontmatter?.[GLOBAL_COMPONENTS_KEY] === false ||
    (Boolean(search) &&
      new URLSearchParams(search).get(GLOBAL_COMPONENTS_KEY) ===
        QueryStatus.Hide);

  if (import.meta.env.SSG_MD) {
    return (
      <Root>
        {renderWebMcp && <WebMCP />}
        {import.meta.env.ENABLE_LLMS_HINT && <LlmsHint />}
        <Layout />
      </Root>
    );
  }

  return (
    <Root>
      {renderWebMcp && <WebMCP />}
      {import.meta.env.ENABLE_LLMS_HINT && <LlmsHint />}
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
