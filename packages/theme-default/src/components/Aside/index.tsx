import type { Header } from '@rspress/shared';
import { useEffect } from 'react';
import {
  bindingAsideScroll,
  parseInlineMarkdownText,
  renderInlineMarkdown,
} from '../../logic';
import './index.scss';
import { useLocation } from '@rspress/runtime';
import { Link } from '../Link';

const TocItem = ({
  header,
  baseHeaderLevel,
}: { header: Header; baseHeaderLevel: number }) => {
  return (
    <li>
      <Link
        href={`#${header.id}`}
        title={parseInlineMarkdownText(header.text)}
        className="aside-link transition-all duration-300 hover:text-text-1 text-text-2 block"
        style={{
          marginLeft: (header.depth - baseHeaderLevel) * 12,
          fontWeight: 'semibold',
        }}
      >
        <span className="aside-link-text block">
          {renderInlineMarkdown(header.text)}
        </span>
      </Link>
    </li>
  );
};

export function Aside(props: { headers: Header[]; outlineTitle: string }) {
  const { headers } = props;
  const hasOutline = headers.length > 0;
  // For outline text highlight
  const baseHeaderLevel = headers[0]?.depth || 2;
  const { pathname } = useLocation();

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
