import { Header } from '@rspress/shared';
import { usePageData } from '@rspress/runtime';
import { scrollToTarget } from '#theme/logic';
import './index.css';

const TocItem = (header: Header) => {
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
        }}
      >
        <span className={'rspress-toc-link-text block'}>{header.text}</span>
      </a>
    </li>
  );
};

export function Toc() {
  const { page } = usePageData();

  return (
    <ul>
      {page.toc.map(item => (
        <TocItem key={item.id} {...item} />
      ))}
    </ul>
  );
}
