import { MDXProvider } from '@mdx-js/react';
import { Content, usePage, useSite } from '@rspress/runtime';
import { getCustomMDXComponent } from '@theme';
import { slug } from 'github-slugger';
import { A } from '../../components/DocContent/docComponents/a';
import { H1 } from '../../components/DocContent/docComponents/title';
import './doc.scss';

function FallbackTitle() {
  const { site } = useSite();
  const { page } = usePage();
  const { headingTitle, title } = page;
  const titleSlug = title && slug(title);

  return (
    site.themeConfig.fallbackHeadingTitle !== false &&
    !headingTitle &&
    titleSlug && (
      <H1 id={titleSlug}>
        {title}
        <A className="header-anchor" href={`#${titleSlug}`} aria-hidden>
          #
        </A>
      </H1>
    )
  );
}

export function DocContent({
  components,
}: {
  components: Record<string, React.FC<any>> | undefined;
}) {
  const mdxComponents = { ...getCustomMDXComponent(), ...components };

  return (
    <MDXProvider components={mdxComponents}>
      <FallbackTitle />
      <Content />
    </MDXProvider>
  );
}
