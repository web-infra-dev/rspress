import { renderInlineMarkdown } from '@theme';
import { slug } from 'github-slugger';
import { A } from './docComponents/a';
import { H1, H2, H3, H4, H5, H6 } from './docComponents/title';

const HEADING_MAP = {
  1: H1,
  2: H2,
  3: H3,
  4: H4,
  5: H5,
  6: H6,
};

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
  const titleSlug = title && slug(title.trim());

  const Element = HEADING_MAP[level] || H1;

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
