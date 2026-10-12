import {
  routePathToMdPath,
  usePage,
  usePages,
  useWebMcp,
  pathnameToRouteService,
  useSite,
  withBase,
  withSiteOrigin,
  Head,
} from '@rspress/core/runtime';

import type React from 'react';
import {
  defineTool,
  readPage,
  resolveInternalRoute,
  routePathField,
} from '../../../runtime/webMcp/tools';

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
  // Expose page-reading tools while this component declares Markdown access.
  // This build-time condition never changes while the component is mounted.
  if (import.meta.env.ENABLE_WEBMCP && !import.meta.env.SSR) {
    const { pages } = usePages();
    useWebMcp(
      defineTool(
        'get_page',
        'Read metadata and generated Markdown for a known documentation route without navigating. Paths are relative to the site base.',
        { routePath: routePathField },
        ['routePath'],
        (args, signal) => {
          const target = resolveInternalRoute(args.routePath as string, {
            origin: window.location.origin,
            resolveRoute: pathname => pathnameToRouteService(pathname)?.path,
          });
          const path = pathnameToRouteService(
            new URL(target, window.location.origin).pathname,
          )?.path;
          const targetPage = pages.find(page => page.routePath === path);
          if (!targetPage)
            throw new TypeError(`Unknown internal route: ${path}`);
          return readPage(targetPage, site.base, signal);
        },
      ),
    );
    useWebMcp(
      defineTool(
        'get_current_page',
        'Read metadata, frontmatter, table of contents and generated Markdown for the current documentation page.',
        {},
        [],
        (_args, signal) => readPage(page, site.base, signal),
      ),
    );
  }

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
    <>
      <Head>
        <link rel="alternate" type="text/markdown" href={pageMdUrl} />
        <link rel="describedby" href={llmsTxtUrl} />
      </Head>
      <div className="rp-llms-hint" style={visuallyHiddenStyle}>
        {hintText}
      </div>
    </>
  );
}
