import type { Header } from '@rspress/shared';
import './index.css';
import { renderInlineMarkdown } from '../../logic/utils';
import { useDynamicToc } from '../Aside/useDynamicToc';
import { Link } from '../Link';

const TocItem = ({
  header,
  onItemClick,
}: {
  header: Header;
  onItemClick?: (header: Header) => void;
}) => {
  return (
    <li>
      <Link
        href={`#${header.id}`}
        className={'rspress-toc-link sm:rp-text-normal rp-text-sm'}
        style={{
          marginLeft: (header.depth - 2) * 12,
        }}
        onClick={() => {
          onItemClick?.(header);
        }}
      >
        <span className={'rspress-toc-link-text rp-block'}>
          {renderInlineMarkdown(header.text)}
        </span>
      </Link>
    </li>
  );
};

export function Toc({
  onItemClick,
}: {
  onItemClick?: (header: Header) => void;
}) {
  const headers = useDynamicToc();
  return (
    headers.length > 0 && (
      <ul>
        {headers.map(item => (
          <TocItem key={item.id} header={item} onItemClick={onItemClick} />
        ))}
      </ul>
    )
  );
}
