import type { Header } from '@rspress/shared';
import { useLocation } from '@rspress/runtime';
import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_NAV_HEIGHT,
  bindingAsideScroll,
  scrollToTarget,
} from '../../logic/sideEffects';
import { useHiddenNav } from '../../logic/useHiddenNav';
import {
  parseInlineMarkdownText,
  renderInlineMarkdown,
} from '../../logic/utils';
import './index.scss';

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

const useDynamicToc = () => {
  const [headers, setHeaders] = useState<Header[]>([]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
    const collectedHeaders: Header[] = [];
    const elements = target?.querySelectorAll('h1, h2, h3, h4');
    elements?.forEach(el => {
      if (el.id) {
        collectedHeaders.push({
          id: el.id,
          text: el.innerHTML,
          depth: parseInt(el.tagName[1]),
        });
      }
    });
    setHeaders(collectedHeaders);
    });

    const target = document.querySelector('.rspress-doc');
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return headers;
};

export function Aside(props: { outlineTitle: string }) {
  const headers = useDynamicToc();
  const baseHeaderLevel = headers[0]?.depth || 2;
  const hiddenNav = useHiddenNav();

  const { hash: locationHash = '', pathname } = useLocation();
  const decodedHash: string = useMemo(() => {
    return decodeURIComponent(locationHash);
  }, [locationHash]);

  useEffect(() => {
    let unbinding: (() => void) | undefined;

    setTimeout(() => {
      unbinding = bindingAsideScroll();
    }, 100);

    return () => {
      if (unbinding) {
        unbinding();
      }
    };
  }, [headers]);

  useEffect(() => {
    if (decodedHash.length === 0) {
      window.scrollTo(0, 0);
    } else {
      const target = document.getElementById(decodedHash.slice(1));
      if (target) {
        scrollToTarget(target, false, hiddenNav ? 0 : DEFAULT_NAV_HEIGHT);
      }
    }
  }, [decodedHash, headers, pathname]);

  return (
    <div className="rp-flex rp-flex-col">
      <div
        id="aside-container"
        className="rp-relative rp-text-sm rp-font-medium"
      >
        <div className="rp-leading-7 rp-block rp-text-sm rp-font-semibold rp-pl-3">
          {props.outlineTitle}
        </div>
        <nav className="rp-mt-1">
          <ul className="rp-relative">
            {headers.map(header => (
              <TocItem
                key={`${pathname}#${header.id}`}
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
