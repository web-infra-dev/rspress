import { useEffect } from 'react';
import type { Header } from '@rspress/shared';
import {
  useHiddenNav,
  scrollToTarget,
  bindingAsideScroll,
  renderInlineMarkdown,
  parseInlineMarkdownText,
} from '../../logic';
import { DEFAULT_NAV_HEIGHT } from '../../logic/sideEffects';
import './index.scss';

export function Aside(props: { headers: Header[]; outlineTitle: string }) {
  const { headers } = props;
  const hasOutline = headers.length > 0;
  // For outline text highlight
  const baseHeaderLevel = headers[0]?.depth || 2;
  const hiddenNav = useHiddenNav();

  useEffect(() => {
    let unbinding: (() => void) | undefined;

    setTimeout(() => {
      unbinding = bindingAsideScroll();
    }, 100);
    const hash = decodeURIComponent(window.location.hash);
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        scrollToTarget(target, false, hiddenNav ? 0 : DEFAULT_NAV_HEIGHT);
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
          title={parseInlineMarkdownText(header.text)}
          className="aside-link transition-all duration-300 hover:text-text-1 text-text-2 block"
          style={{
            marginLeft: (header.depth - baseHeaderLevel) * 12,
            fontWeight: 'semibold',
          }}
          onClick={e => {
            e.preventDefault();
            window.location.hash = header.id;
            const target = document.getElementById(header.id);
            if (target) {
              scrollToTarget(target, false, hiddenNav ? 0 : DEFAULT_NAV_HEIGHT);
            }
          }}
        >
          <span className="aside-link-text block">
            {renderInlineMarkdown(header.text)}
          </span>
        </a>
      </li>
    );
  };

  return (
    <div className="flex flex-col">
      <div className={hasOutline ? '<lg:hidden' : 'hidden'}>
        <div id="aside-container" className="relative text-sm font-medium">
          <div className="leading-7 block text-sm font-semibold pl-3">
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
