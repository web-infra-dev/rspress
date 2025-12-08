import { MDXProvider } from '@mdx-js/react';
import { Content, usePage, useSite } from '@rspress/core/runtime';
import { Callout, FallbackHeading, getCustomMDXComponent } from '@theme';
import { useScrollAfterNav } from '../../logic/useScrollAfterNav';

import './doc.scss';

export function FallbackTitle() {
  const { site } = useSite();
  const { page } = usePage();
  const { headingTitle, title } = page;

  return (
    site.themeConfig.fallbackHeadingTitle !== false &&
    !headingTitle && <FallbackHeading level={1} title={title} />
  );
}

export function DocContent({
  components,
  isOverviewPage = false,
}: {
  components: Record<string, React.FC<any>> | undefined;
  isOverviewPage?: boolean;
}) {
  useScrollAfterNav();

  const mdxComponents = {
    ...getCustomMDXComponent(),
    ...components,

    // custom components can be added here
    $$$callout$$$: Callout, // FIXME: For .md files, .md files cannot add import statements
  };

  return (
    <MDXProvider components={mdxComponents}>
      {!isOverviewPage && <FallbackTitle />}
      <Content />
    </MDXProvider>
  );
}
