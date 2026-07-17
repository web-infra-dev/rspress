import { withBase, withSiteOrigin, type UserConfig } from '@rspress/shared';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { routePathToMdPath } from './ssg-md/llms/llmsTxt';

export function isLlmsUIEnabled(config: UserConfig): boolean {
  return Boolean(config.themeConfig?.llmsUI ?? config.llms);
}

export function isLlmsHintEnabled(config: UserConfig): boolean {
  const llmsUI = config.themeConfig?.llmsUI;
  return (
    isLlmsUIEnabled(config) &&
    (typeof llmsUI !== 'object' || llmsUI.injectLlmsHint !== false)
  );
}

export function renderLlmsHiddenHint(
  config: UserConfig,
  routePath: string,
): string {
  if (!isLlmsHintEnabled(config)) {
    return '';
  }

  const base = config.base ?? '/';
  const llmsTxtUrl = withSiteOrigin(
    withBase('/llms.txt', base),
    config.siteOrigin,
  );
  const llmsFullTxtUrl = withSiteOrigin(
    withBase('/llms-full.txt', base),
    config.siteOrigin,
  );
  const pageMdUrl = routePathToMdPath(routePath, base, config.siteOrigin);

  return renderToStaticMarkup(
    createElement(
      'div',
      { style: { display: 'none' }, hidden: true, 'aria-hidden': 'true' },
      `Are you an LLM? View ${llmsTxtUrl} for optimized Markdown documentation, or ${llmsFullTxtUrl} for full documentation bundle. This page is also available as Markdown at ${pageMdUrl}`,
    ),
  );
}
