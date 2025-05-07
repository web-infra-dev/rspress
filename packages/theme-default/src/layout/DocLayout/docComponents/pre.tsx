import { usePageData } from '@rspress/runtime';
import { useRef } from 'react';
import type { CodeProps } from './code';
import {
  CodeButtonGroup,
  type CodeButtonGroupProps,
  useCodeButtonGroup,
} from './code/CodeButtonGroup';

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

type ShikiPreProps = {
  codeElementClassName: string | undefined;
  codeTitle: string | undefined;
  child: React.ReactElement;
  preElementRef: React.RefObject<HTMLPreElement>;
  className: string | undefined;
  codeButtonGroupProps?: Omit<
    CodeButtonGroupProps,
    'preElementRef' | 'codeWrap' | 'toggleCodeWrap'
  >;
} & React.HTMLProps<HTMLPreElement>;

function ShikiPre({
  child,
  codeElementClassName,
  preElementRef,
  codeTitle,
  className,
  codeButtonGroupProps,
  ...otherProps
}: ShikiPreProps) {
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
          {...codeButtonGroupProps}
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
  codeHighlighter: codeHighlighterFromProps,
  ...otherProps
}: {
  children: React.ReactElement[] | React.ReactElement;
  className?: string;
  title?: string;
  codeHighlighter?: string;
} & Partial<ShikiPreProps>) {
  const { siteData } = usePageData();
  const codeHighlighter =
    codeHighlighterFromProps ?? siteData.markdown.codeHighlighter;
  const preElementRef = useRef<HTMLPreElement>(null);

  const renderChild = (child: React.ReactElement) => {
    const { className: codeElementClassName, meta } = child.props as CodeProps;

    if (codeHighlighter === 'shiki') {
      return (
        <ShikiPre
          className={className}
          {...otherProps}
          child={child}
          codeElementClassName={codeElementClassName}
          codeTitle={title}
          preElementRef={preElementRef}
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
