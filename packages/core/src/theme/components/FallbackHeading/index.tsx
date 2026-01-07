import { getCustomMDXComponent, renderInlineMarkdown } from '@theme';
import { slug } from 'github-slugger';
import { useMemo } from 'react';

const getHeadingMap = () => {
  const { h1, h2, h3, h4, h5, h6 } = getCustomMDXComponent();
  return {
    1: h1,
    2: h2,
    3: h3,
    4: h4,
    5: h5,
    6: h6,
  };
};

export function FallbackHeadingMarkdown({
  level,
  title,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
}) {
  return <>{`${'#'.repeat(level)} ${title}\n\n`}</>;
}

/**
 * Escape Hatch
 * A fallback heading component in runtime that generates an anchor link based on the title prop.
 *
 * @param level - The heading level (1-6).
 * @param title - The title text to display in the heading.
 */
export function FallbackHeading({
  level,
  title,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
}) {
  if (process.env.__SSR_MD__) {
    return <FallbackHeadingMarkdown level={level} title={title} />;
  }

  const titleSlug = title && slug(title.trim());

  const Element = useMemo(() => {
    const headingMap = getHeadingMap();
    return headingMap[level] || headingMap[1];
  }, [level]);

  const A = useMemo(() => {
    return getCustomMDXComponent().a;
  }, []);

  return (
    titleSlug && (
      <Element id={titleSlug}>
        <span {...renderInlineMarkdown(title)}></span>
        <A className="rp-header-anchor" href={`#${titleSlug}`} aria-hidden>
          #
        </A>
      </Element>
    )
  );
}
