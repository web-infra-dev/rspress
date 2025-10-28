import type { Header } from '@rspress/core';
import { Link } from '@theme';
import clsx from 'clsx';
import {
  parseInlineMarkdownText,
  renderInlineMarkdown,
} from '../../logic/utils';
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
            element.classList.contains('rp-doc-layout__aside') ||
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
    >
      <span
        className="rp-aside__toc-item__text"
        {...renderInlineMarkdown(header.text)}
      ></span>
    </Link>
  );
};
