import clsx from 'clsx';
import { isValidElement, useRef } from 'react';
import {
  CodeButtonGroup,
  type CodeButtonGroupProps,
  useCodeWrap,
} from './CodeButtonGroup';
import './pre.scss';

export type ShikiPreProps = {
  containerElementClassName: string | undefined;
  title: string | undefined;
  className: string | undefined;
  codeButtonGroupProps?: Omit<
    CodeButtonGroupProps,
    'preElementRef' | 'codeWrap' | 'toggleCodeWrap'
  >;

  // private
  preElementRef: React.RefObject<HTMLPreElement | null>;
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
  const { codeWrap, toggleCodeWrap } = useCodeWrap();
  return (
    <div className={containerElementClassName}>
      {title && (
        <div className="rspress-code-title rp-codeblock_title">{title}</div>
      )}
      <div className="rspress-code-content rp-codeblock_content">
        <div>
          <pre
            ref={preElementRef}
            className={clsx(codeWrap && 'rp-code-force-wrap', className)}
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
 *  <div class="rspress-code-title rp-codeblock_title">test.js</div>
 *  <div class="rspress-code-content rp-codeblock_content">
 *    <div>
 *      <pre class="shiki css-variables" tabindex="0">
 *        <code class="language-js">
 *        </code>
 *      </pre>
 *    </div>
 *    <div class="rp-code-button-group">
 *      <button class="rp-code-button-group__button" title="Toggle code wrap"></button>
 *      <button class="rp-code-button-group__button rp-code-copy-button" title="Copy code"></button>
 *    </div>
 *  </div>
 *</div>
 *```
 */
export function PreWithCodeButtonGroup({
  containerElementClassName,
  children,
  className,
  title,
  codeButtonGroupProps,
  ...otherProps
}: PreWithCodeButtonGroupProps) {
  const preElementRef = useRef<HTMLPreElement>(null);

  const renderChild = (child: React.ReactElement<{ className?: string }>) => {
    const { className: codeElementClassName } = child.props;
    return (
      <ShikiPre
        {...otherProps}
        child={child}
        className={className}
        title={title}
        preElementRef={preElementRef}
        codeButtonGroupProps={codeButtonGroupProps}
        containerElementClassName={
          containerElementClassName ?? codeElementClassName
        }
      />
    );
  };

  if (Array.isArray(children)) {
    return <>{children.map(child => renderChild(child))}</>;
  }

  if (!isValidElement<{ className?: string }>(children)) return null;

  return renderChild(children);
}
