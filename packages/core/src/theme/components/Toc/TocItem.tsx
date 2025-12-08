import type { Header } from '@rspress/core';
import { Link, parseInlineMarkdownText, renderInlineMarkdown } from '@theme';
import clsx from 'clsx';
import './TocItem.scss';
import { useEffect, useRef } from 'react';
import scrollIntoView from 'scroll-into-view-if-needed';

export const TocItem = ({
  header,
  baseHeaderLevel,
  active,
}: {
  header: Header;
  baseHeaderLevel: number;
  active: boolean;
}) => {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (active && ref.current) {
      scrollIntoView(ref.current, {
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
        boundary: element => {
          const isBoundary =
            element.classList.contains('rp-doc-layout__outline') ||
            element.classList.contains('rspress-doc');
          return !isBoundary;
        },
      });
    }
  }, [active]);

  return (
    <Link
      href={`#${header.id}`}
      ref={ref}
      title={parseInlineMarkdownText(header.text)}
      className={clsx('rp-toc-item', {
        'rp-toc-item--active': active,
      })}
      style={{
        paddingLeft: (header.depth - baseHeaderLevel) * 12,
      }}
      {...{ 'data-depth': header.depth - baseHeaderLevel }}
    >
      <span
        className="rp-toc-item__text rp-doc"
        {...renderInlineMarkdown(header.text)}
      ></span>
    </Link>
  );
};
