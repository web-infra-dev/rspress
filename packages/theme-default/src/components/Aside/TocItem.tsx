import type { Header } from '@rspress/shared';
import clsx from 'clsx';
import {
  parseInlineMarkdownText,
  renderInlineMarkdown,
} from '../../logic/utils';
import { Link } from '../Link';
import './TocItem.scss';

export const TocItem = ({
  header,
  baseHeaderLevel,
  active,
}: {
  header: Header;
  baseHeaderLevel: number;
  active: boolean;
}) => {
  return (
    <Link
      href={`#${header.id}`}
      title={parseInlineMarkdownText(header.text)}
      className={clsx('rp-aside__toc-item', {
        'rp-aside__toc-item--active': active,
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
