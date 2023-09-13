import { Header } from '@rspress/shared';
import { usePageData } from '@/runtime';
import { scrollToTarget } from '@/theme-default';

const TocItem = (header: Header) => {
  return (
    <li key={header.id} className={'py-1'}>
      <a
        href={`#${header.id}`}
        className={'toc-text p-2 rounded-lg hover:cursor-pointer'}
        style={{
          marginLeft: header.depth * 12,
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
        <span
          className={
            'text-lg hover:text-text-1 text-text-2 transition-all duration-300 underline underline-offset-1'
          }
        >
          {header.text}
        </span>
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
