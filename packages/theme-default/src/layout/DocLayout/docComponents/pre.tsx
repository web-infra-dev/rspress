import { useRef } from 'react';
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

export interface PreWithCodeButtonGroupProps extends Partial<ShikiPreProps> {
  children: React.ReactElement[] | React.ReactElement;
  className?: string;
  title?: string;
}

export function PreWithCodeButtonGroup({
  children,
  className,
  title,
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
        codeTitle={title}
        preElementRef={preElementRef}
        {...otherProps}
      />
    );
  };

  if (Array.isArray(children)) {
    return <>{children.map(child => renderChild(child))}</>;
  }

  return renderChild(children);
}
