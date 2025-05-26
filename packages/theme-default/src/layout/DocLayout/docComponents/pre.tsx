import { isValidElement, useRef } from 'react';
import {
  CodeButtonGroup,
  type CodeButtonGroupProps,
  useCodeButtonGroup,
} from './code/CodeButtonGroup';

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

export type ShikiPreProps = {
  codeElementClassName: string | undefined;
  title: string | undefined;
  className: string | undefined;
  codeButtonGroupProps?: Omit<
    CodeButtonGroupProps,
    'preElementRef' | 'codeWrap' | 'toggleCodeWrap'
  >;

  // private
  preElementRef: React.RefObject<HTMLPreElement>;
  child: React.ReactElement;
} & React.HTMLProps<HTMLPreElement>;

function ShikiPre({
  child,
  codeElementClassName,
  preElementRef,
  title,
  className,
  codeButtonGroupProps,
  ...otherProps
}: ShikiPreProps) {
  const { codeWrap, toggleCodeWrap } = useCodeButtonGroup();
  return (
    <div className={codeElementClassName ?? ''}>
      {title && <div className="rspress-code-title">{title}</div>}
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

export interface PreWithCodeButtonGroupProps
  extends React.HTMLProps<HTMLPreElement> {
  codeElementClassName?: string;
  className?: string;
  title?: string;
  codeButtonGroupProps?: Omit<
    CodeButtonGroupProps,
    'preElementRef' | 'codeWrap' | 'toggleCodeWrap'
  >;
}

export function PreWithCodeButtonGroup({
  children,
  className,
  title,
  codeButtonGroupProps,
  ...otherProps
}: PreWithCodeButtonGroupProps) {
  const preElementRef = useRef<HTMLPreElement>(null);

  const renderChild = (child: React.ReactElement) => {
    const { className: codeElementClassName } = child.props;

    return (
      <ShikiPre
        child={child}
        className={className}
        codeElementClassName={codeElementClassName}
        title={title}
        preElementRef={preElementRef}
        codeButtonGroupProps={codeButtonGroupProps}
        {...otherProps}
      />
    );
  };

  if (Array.isArray(children)) {
    return <>{children.map(child => renderChild(child))}</>;
  }

  if (!isValidElement(children)) return null;

  return renderChild(children);
}
