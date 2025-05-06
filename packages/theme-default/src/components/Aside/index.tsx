import { useLocation } from '@rspress/runtime';
import type { Header } from '@rspress/shared';
import { useEffect, useMemo } from 'react';
import { scrollToTarget, useBindingAsideScroll } from '../../logic/sideEffects';
import { useUISwitch } from '../../logic/useUISwitch.js';
import {
  parseInlineMarkdownText,
  renderInlineMarkdown,
} from '../../logic/utils';

import './index.scss';
import { useDynamicToc } from './useDynamicToc';

const TocItem = ({
  header,
  baseHeaderLevel,
}: { header: Header; baseHeaderLevel: number }) => {
  return (
    <li>
      <a
        href={`#${header.id}`}
        title={parseInlineMarkdownText(header.text)}
        className="aside-link rp-transition-all rp-duration-300 hover:rp-text-text-1 rp-text-text-2 rp-block"
        style={{
          marginLeft: (header.depth - baseHeaderLevel) * 12,
          fontWeight: 'semibold',
        }}
        onClick={e => {
          e.preventDefault();
          window.location.hash = header.id;
        }}
      >
        <span className="aside-link-text rp-block">
          {renderInlineMarkdown(header.text)}
        </span>
      </a>
    </li>
  );
};

export function Aside({ outlineTitle }: { outlineTitle: string }) {
  const { scrollPaddingTop } = useUISwitch();
  const headers = useDynamicToc();

  // For outline text highlight
  const baseHeaderLevel = 2;

  const { hash: locationHash = '', pathname } = useLocation();
  const decodedHash: string = useMemo(
    () => decodeURIComponent(locationHash),
    [locationHash],
  );

  useBindingAsideScroll(headers);

  // why window.scrollTo(0, 0)?
  // when using history.scrollRestoration = 'auto' ref: "useUISwitch.ts", we scroll to the last page's position when navigating to nextPage
  useEffect(() => {
    if (decodedHash.length === 0) {
      window.scrollTo(0, 0);
    } else {
      const target = document.getElementById(decodedHash.slice(1));
      if (target) {
        scrollToTarget(target, false, scrollPaddingTop);
      }
    }
  }, [decodedHash, headers, pathname]);

  if (headers.length === 0) {
    return <></>;
  }

  return (
    <div className="rp-flex rp-flex-col">
      <div
        id="aside-container"
        className="rp-relative rp-text-sm rp-font-medium"
      >
        <div className="rp-leading-7 rp-block rp-text-sm rp-font-semibold rp-pl-3">
          {outlineTitle}
        </div>
        <nav className="rp-mt-1">
          <ul className="rp-relative">
            {headers.map((header, index) => (
              <TocItem
                key={`${header.depth}_${header.text}_${header.id}_${index}`}
                baseHeaderLevel={baseHeaderLevel}
                header={header}
              />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
