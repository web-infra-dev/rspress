import { useRef, useEffect } from 'react';
import { Header } from '@rspress/shared';
import { bindingAsideScroll, scrollToTarget } from '../../logic';
import './index.css';

export function Aside(props: { headers: Header[]; outlineTitle: string }) {
  const { headers } = props;
  const hasOutline = headers.length > 0;
  // For outline text highlight
  const markerRef = useRef<HTMLDivElement>(null);
  const baseHeaderLevel = headers[0]?.depth || 2;

  useEffect(() => {
    let unbinding: (() => void) | undefined;
    if (markerRef.current) {
      markerRef.current.style.opacity = '0';
    }
    setTimeout(() => {
      unbinding = bindingAsideScroll();
    }, 100);
    const hash = decodeURIComponent(window.location.hash);
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        scrollToTarget(target, false);
      }
    }
    return () => {
      if (unbinding) {
        unbinding();
      }
    };
  }, [headers]);

  const renderHeader = (header: Header) => {
    return (
      <li key={header.id}>
        <a
          href={`#${header.id}`}
          className="aside-link transition-all duration-300 hover:text-text-1 text-text-2 block"
          style={{
            paddingLeft: (header.depth - baseHeaderLevel) * 12,
            fontWeight: 'semibold',
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
          <span className="aside-link-text block">{header.text}</span>
        </a>
      </li>
    );
  };

  return (
    <div className="flex flex-col">
      <div className={hasOutline ? `<lg:hidden` : 'hidden'}>
        <div id="aside-container" className="relative text-sm font-medium">
          <div className="leading-7 block text-sm font-semibold pl-4">
            {props.outlineTitle}
          </div>
          <nav className="mt-1">
            <ul className="relative">{headers.map(renderHeader)}</ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
