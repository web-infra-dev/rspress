import type { Header } from '@rspress/shared';
import clsx from 'clsx';
import {
  parseInlineMarkdownText,
  renderInlineMarkdown,
} from '../../logic/utils';
import { Link } from '../Link';
import * as styles from './TocItem.module.scss';

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
    <li>
      <Link
        href={`#${header.id}`}
        title={parseInlineMarkdownText(header.text)}
        className={clsx('aside-link', styles.tocItem, {
          [styles.active]: active,
          'aside-link-active': active,
        })}
        style={{
          paddingLeft: (header.depth - baseHeaderLevel) * 12,
        }}
      >
        <span
          className="aside-link-text"
          {...renderInlineMarkdown(header.text)}
        ></span>
      </Link>
    </li>
  );
};
