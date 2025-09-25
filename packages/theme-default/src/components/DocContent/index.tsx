import { MDXProvider } from '@mdx-js/react';
import { Content, usePage, useSite } from '@rspress/runtime';
import { getCustomMDXComponent } from '@theme';
import './doc.scss';
import { FallbackHeading } from './FallbackHeading';

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
  const mdxComponents = { ...getCustomMDXComponent(), ...components };

  return (
    <MDXProvider components={mdxComponents}>
      {!isOverviewPage && <FallbackTitle />}
      <Content />
    </MDXProvider>
  );
}
