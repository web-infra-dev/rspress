import type { Header } from '@rspress/shared';
import { useEffect, useMemo } from 'react';
import {
  bindingAsideScroll,
  parseInlineMarkdownText,
  renderInlineMarkdown,
  scrollToTarget,
  useHiddenNav,
} from '../../logic';
import { DEFAULT_NAV_HEIGHT } from '../../logic/sideEffects';
import './index.scss';
import { useLocation } from '@rspress/runtime';

const TocItem = ({
  header,
  baseHeaderLevel,
  hiddenNav,
}: { header: Header; baseHeaderLevel: number; hiddenNav: boolean }) => {
  return (
    <li>
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

export function Aside(props: { headers: Header[]; outlineTitle: string }) {
  const { headers } = props;
  const hasOutline = headers.length > 0;
  // For outline text highlight
  const baseHeaderLevel = headers[0]?.depth || 2;
  const hiddenNav = useHiddenNav();

  const { hash: locationHash = '', pathname } = useLocation();
  const decodedHash: string = useMemo(() => {
    return decodeURIComponent(locationHash);
  }, [locationHash]);

  console.log(locationHash, decodedHash);

  useEffect(() => {
    const unbinding = bindingAsideScroll();
    if (decodedHash.length === 0) {
      window.scrollTo(0, 0);
    } else {
      const target = document.getElementById(decodedHash.slice(1));
      if (target) {
        scrollToTarget(target, false, hiddenNav ? 0 : DEFAULT_NAV_HEIGHT);
      }
    }
    return () => {
      if (unbinding) {
        unbinding();
      }
    };
  }, [headers, decodedHash]);

  return (
    <div className="flex flex-col">
      <div className={hasOutline ? '<lg:hidden' : 'hidden'}>
        <div id="aside-container" className="relative text-sm font-medium">
          <div className="leading-7 block text-sm font-semibold pl-3">
            {props.outlineTitle}
          </div>
          <nav className="mt-1">
            <ul className="relative">
              {headers.map(header => {
                return (
                  <TocItem
                    key={`${pathname}#${header.id}`}
                    baseHeaderLevel={baseHeaderLevel}
                    header={header}
                    hiddenNav={hiddenNav}
                  />
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
