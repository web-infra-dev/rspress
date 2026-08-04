import {
  routePathToMdPath,
  usePage,
  useSite,
  withBase,
  withSiteOrigin,
} from '@rspress/core/runtime';
import type React from 'react';

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

function createLlmsHintText({
  llmsTxtUrl,
  llmsFullTxtUrl,
  pageMdUrl,
}: {
  llmsTxtUrl: string;
  llmsFullTxtUrl: string;
  pageMdUrl?: string;
}) {
  const text = `For AI agents: the complete documentation index is available at ${llmsTxtUrl}, the full documentation bundle is available at ${llmsFullTxtUrl}`;
  return pageMdUrl
    ? `${text}, and this page is available as Markdown at ${pageMdUrl}.`
    : `${text}.`;
}

export function LlmsHint() {
  const { page } = usePage();
  const { site } = useSite();
  if (!page?.routePath) {
    return null;
  }

  const isMultiVersion = site.multiVersion.versions.length > 0;
  const versionPrefix =
    isMultiVersion && page.version !== site.multiVersion.default
      ? `${page.version}/`
      : '';
  const langPrefix = page.lang === site.lang ? '' : `${page.lang}/`;
  const llmsTxtUrl = withSiteOrigin(
    withBase(`/${versionPrefix}${langPrefix}llms.txt`),
  );
  const llmsFullTxtUrl = withSiteOrigin(
    withBase(`/${versionPrefix}${langPrefix}llms-full.txt`),
  );

  if (import.meta.env.SSG_MD) {
    return `> ${createLlmsHintText({ llmsTxtUrl, llmsFullTxtUrl })}\n\n`;
  }

  const pageMdUrl = withSiteOrigin(routePathToMdPath(page.routePath));
  const hintText = createLlmsHintText({
    llmsTxtUrl,
    llmsFullTxtUrl,
    pageMdUrl,
  });

  return (
    <div className="rp-llms-hint" style={visuallyHiddenStyle}>
      {hintText}
    </div>
  );
}
