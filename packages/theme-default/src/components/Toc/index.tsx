import type { Header } from '@rspress/shared';
import { usePageData } from '@rspress/runtime';
import { renderInlineMarkdown, scrollToTarget } from '../../logic';
import './index.css';

const TocItem = ({
  header,
  onItemClick,
}: {
  header: Header;
  onItemClick?: (header: Header) => void;
}) => {
  return (
    <li key={header.id}>
      <a
        href={`#${header.id}`}
        className={'rspress-toc-link sm:text-normal text-sm'}
        style={{
          marginLeft: (header.depth - 2) * 12,
        }}
        onClick={e => {
          e.preventDefault();
          window.location.hash = header.id;
          const target = document.getElementById(header.id);
          if (target) {
            scrollToTarget(target, false);
          }
          onItemClick?.(header);
        }}
      >
        <span className={'rspress-toc-link-text block'}>
          {renderInlineMarkdown(header.text)}
        </span>
      </a>
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
    <ul>
      {page.toc.map(item => (
        <TocItem key={item.id} header={item} onItemClick={onItemClick} />
      ))}
    </ul>
  );
}
