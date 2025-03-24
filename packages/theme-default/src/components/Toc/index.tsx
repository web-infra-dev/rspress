import { usePageData } from '@rspress/runtime';
import type { Header } from '@rspress/shared';
import './index.css';
import { renderInlineMarkdown } from '../../logic/utils';
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
  const { page } = usePageData();
  return (
    page.toc.length > 0 && (
      <ul>
        {page.toc.map(item => (
          <TocItem key={item.id} header={item} onItemClick={onItemClick} />
        ))}
      </ul>
    )
  );
}
