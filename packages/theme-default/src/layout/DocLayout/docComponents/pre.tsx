import { usePageData } from '@rspress/runtime';
import { useRef } from 'react';
import type { CodeProps } from './code';
import { CodeButtonGroup, useCodeButtonGroup } from './code/CodeButtonGroup';

const DEFAULT_LANGUAGE_CLASS = 'language-bash';

export function parseTitleFromMeta(meta: string | undefined): string {
  if (!meta) {
    return '';
  }
  let result = meta;
  const highlightReg = /{[\d,-]*}/i;
  const highlightMeta = highlightReg.exec(meta)?.[0];
  if (highlightMeta) {
    result = meta.replace(highlightReg, '').trim();
  }
  result = result.split('=')[1] ?? '';
  return result?.replace(/["'`]/g, '');
}

function ShikiPre({
  child,
  codeElementClassName,
  preElementRef,
  codeTitle,
  className,
  ...otherProps
}: {
  codeElementClassName: string | undefined;
  codeTitle: string | undefined;
  child: React.ReactElement;
  preElementRef: React.RefObject<HTMLPreElement>;
  className: string | undefined;
  [key: string]: any;
}) {
  const { codeWrap, toggleCodeWrap } = useCodeButtonGroup();
  return (
    <div className={codeElementClassName ?? ''}>
      {codeTitle && <div className="rspress-code-title">{codeTitle}</div>}
      <div className="rspress-code-content rspress-scrollbar">
        <div>
          <pre
            ref={preElementRef}
            className={[codeWrap ? 'rp-force-wrap' : '', className || '']
              .filter(Boolean)
              .join(' ')}
            {...otherProps}
          >
            {child}
          </pre>
        </div>
        <CodeButtonGroup
          preElementRef={preElementRef}
          codeWrap={codeWrap}
          toggleCodeWrap={toggleCodeWrap}
        />
      </div>
    </div>
  );
}

export function Pre({
  children,
  className,
  title,
  ...otherProps
}: {
  children: React.ReactElement[] | React.ReactElement;
  className?: string;
  title?: string;
  [key: string]: any;
}) {
  const { siteData } = usePageData();
  const codeHighlighter = siteData.markdown.codeHighlighter;
  const preElementRef = useRef<HTMLPreElement>(null);

  const renderChild = (child: React.ReactElement) => {
    const { className: codeElementClassName, meta } = child.props as CodeProps;

    if (codeHighlighter === 'shiki') {
      return (
        <ShikiPre
          child={child}
          className={className}
          codeElementClassName={codeElementClassName}
          codeTitle={title}
          preElementRef={preElementRef}
          {...otherProps}
        />
      );
    }

    const codeTitle = parseTitleFromMeta(meta);
    return (
      <div className={codeElementClassName || DEFAULT_LANGUAGE_CLASS}>
        {codeTitle && <div className="rspress-code-title">{codeTitle}</div>}
        <div className="rspress-code-content rspress-scrollbar">{child}</div>
      </div>
    );
  };

  if (Array.isArray(children)) {
    return <div>{children.map(child => renderChild(child))}</div>;
  }
  return renderChild(children);
}
