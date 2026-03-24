import {
  CodeButtonGroup,
  type CodeButtonGroupProps,
  IconArrowDown,
  SvgWrapper,
  useCodeButtonGroup,
} from '@rspress/core/theme';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import './index.scss';

export type CodeBlockProps = {
  title?: string;
  lang?: string;
  /**
   * @default false
   */
  wrapCode?: boolean;
  /**
   * @default false
   */
  lineNumbers?: boolean;
  /**
   * @default false
   */
  toggle?: boolean;
  /**
   * @default 300
   */
  height?: number;
  containerElementClassName?: string;
  codeButtonGroupProps?: Omit<
    CodeButtonGroupProps,
    'preElementRef' | 'codeWrap' | 'toggleCodeWrap'
  >;
  children?: React.ReactNode;
};
/**
 * This component only provides styling and must be used with Shiki.
 * If you need runtime code highlighting, please use <CodeBlockRuntime /> instead.
 *
 * @example
 *
 * Input:
 *
 * ```tsx
 * <CodeBlock lang="js" title="test.js">
 *    <pre class="shiki css-variables">
 *      <code></code>
 *    </pre>
 * </CodeBlock>
 * ```
 *
 * Expected html output:
 *
 * ```html
 * <div class="rp-codeblock language-js">
 *  <div class="rp-codeblock__title">test.js</div>
 *  <div class="rp-codeblock__content">
 *    <div>
 *      <pre class="shiki css-variables">
 *        <code>
 *        </code>
 *      </pre>
 *    </div>
 *    <div class="rp-code-button-group">
 *      <button class="rp-code-button-group__button rp-code-wrap-button" title="Toggle code wrap"></button>
 *      <button class="rp-code-button-group__button rp-code-copy-button" title="Copy code"></button>
 *    </div>
 *  </div>
 *</div>
 *```
 */
export function CodeBlock({
  containerElementClassName,
  title,
  lang = 'txt',
  wrapCode: wrapCodeProp = false,
  lineNumbers: lineNumbersProp = false,
  toggle = false,
  height = 300,
  codeButtonGroupProps,
  children,
}: CodeBlockProps) {
  if (process.env.__SSR_MD__) {
    return <>{children}</>;
  }

  const { codeWrap, toggleCodeWrap, copyElementRef } =
    useCodeButtonGroup(wrapCodeProp);
  const [expanded, setExpanded] = useState(false);
  const [needToggle, setNeedToggle] = useState(false);
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toggle || !contentRef.current) {
      setNeedToggle(false);
      return;
    }
    const realHeight = contentRef.current.scrollHeight;
    setNeedToggle(realHeight > height);
  }, [toggle, height]);

  const handleToggle = useCallback(() => {
    if (expanded) {
      setExpanded(false);
      requestAnimationFrame(() => {
        if (codeBlockRef.current) {
          const rect = codeBlockRef.current.getBoundingClientRect();
          if (rect.top < 0) {
            window.scrollBy({
              top: rect.top - 16,
              behavior: 'smooth',
            });
          }
        }
      });
    } else {
      setExpanded(true);
    }
  }, [expanded]);

  return (
    <div
      className={clsx(
        'rp-codeblock',
        `language-${lang}`,
        containerElementClassName,
      )}
      ref={codeBlockRef}
    >
      {title && <div className="rp-codeblock__title">{title}</div>}
      <div
        className={clsx(
          'rp-codeblock__content',
          codeWrap && 'rp-codeblock__content--code-wrap',
          lineNumbersProp && 'rp-codeblock__content--line-numbers',
          needToggle && !expanded && 'rp-codeblock__content--collapsed',
        )}
        style={
          needToggle && !expanded ? { maxHeight: `${height}px` } : undefined
        }
        ref={contentRef}
      >
        <div
          className="rp-codeblock__content__scroll-container rp-scrollbar rp-scrollbar--always"
          ref={copyElementRef}
        >
          {children}
        </div>
        <CodeButtonGroup
          {...codeButtonGroupProps}
          copyElementRef={copyElementRef}
          codeWrap={codeWrap}
          toggleCodeWrap={toggleCodeWrap}
        />
      </div>
      {needToggle && (
        <button
          type="button"
          className={clsx(
            'rp-codeblock__toggle-btn',
            expanded && 'rp-codeblock__toggle-btn--expanded',
          )}
          onClick={handleToggle}
        >
          <SvgWrapper
            icon={IconArrowDown}
            className="rp-codeblock__toggle-btn__icon"
          />
        </button>
      )}
    </div>
  );
}
