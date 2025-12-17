import { MDXProvider } from '@mdx-js/react';
import { Content, usePage, useSite } from '@rspress/core/runtime';
import {
  Callout,
  FallbackHeading,
  getCustomMDXComponent,
  useScrollAfterNav,
} from '@theme';
import './doc.scss';

function FallbackTitle() {
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
  afterDocContent,
  beforeDocContent,
}: {
  components: Record<string, React.FC<any>> | undefined;
  isOverviewPage?: boolean;
  /**
   * Optional React node rendered before the main document content.
   * Can be used for banners, notices, or custom elements at the top of the page.
   */
  beforeDocContent?: React.ReactNode;
  /**
   * Optional React node rendered after the main document content.
   * Can be used for footers, navigation, or other content at the bottom of the page.
   */
  afterDocContent?: React.ReactNode;
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
      {beforeDocContent}
      {!isOverviewPage && <FallbackTitle />}
      <Content />
      {afterDocContent}
    </MDXProvider>
  );
}
