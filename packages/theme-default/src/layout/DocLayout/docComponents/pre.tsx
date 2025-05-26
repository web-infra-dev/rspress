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
  containerElementClassName: string | undefined;
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
  containerElementClassName,
  preElementRef,
  title,
  className,
  codeButtonGroupProps,
  ...otherProps
}: ShikiPreProps) {
  const { codeWrap, toggleCodeWrap } = useCodeButtonGroup();
  return (
    <div className={containerElementClassName}>
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
  containerElementClassName?: string;
  className?: string;
  title?: string;
  codeButtonGroupProps?: Omit<
    CodeButtonGroupProps,
    'preElementRef' | 'codeWrap' | 'toggleCodeWrap'
  >;
}

/**
 * expected wrapped pre element is:
 * ```html
 *<div class="language-js">
 *  <div class="rspress-code-title">test.js</div>
 *  <div class="rspress-code-content rspress-scrollbar">
 *    <div>
 *      <pre class="shiki css-variables" tabindex="0">
 *        <code class="language-js">
 *        </code>
 *      </pre>
 *    </div>
 *    <div class="code-button-group_fb445">
 *      <button class="" title="Toggle code wrap"></button>
 *      <button class="code-copy-button_c5089" title="Copy code"></button>
 *    </div>
 *  </div>
 *</div>
 *```
 */
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
        containerElementClassName={codeElementClassName}
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
