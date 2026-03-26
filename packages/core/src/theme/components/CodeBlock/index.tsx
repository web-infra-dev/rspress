import { useSite } from '@rspress/core/runtime';
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

const DEFAULT_FOLD_HEIGHT = 300;

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
  fold?: boolean;
  height?: number;
  containerElementClassName?: string;
  codeButtonGroupProps?: Omit<
    CodeButtonGroupProps,
    'preElementRef' | 'wrapCode' | 'toggleWrapCode'
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
  fold = false,
  height,
  codeButtonGroupProps,
  children,
}: CodeBlockProps) {
  if (process.env.__SSR_MD__) {
    return <>{children}</>;
  }

  const { site } = useSite();
  const { defaultCodeOverview } = site.markdown;

  // Resolve effective behavior:
  // 1. Explicit meta props (fold / height) take priority
  // 2. Fall back to defaultCodeOverview config
  const hasExplicitMeta = fold || height !== undefined;

  let effectiveFold: boolean;
  let effectiveHeight: number | undefined;
  let hasFixedHeight: boolean;

  if (hasExplicitMeta) {
    effectiveFold = fold;
    effectiveHeight = fold ? (height ?? DEFAULT_FOLD_HEIGHT) : height;
    hasFixedHeight = !fold && height !== undefined;
  } else if (defaultCodeOverview?.height !== undefined) {
    const overview = defaultCodeOverview.overview ?? 'scroll';
    effectiveFold = overview === 'fold';
    effectiveHeight = defaultCodeOverview.height;
    hasFixedHeight = overview === 'scroll';
  } else {
    effectiveFold = false;
    effectiveHeight = undefined;
    hasFixedHeight = false;
  }

  const {
    wrapCode: wrapCodeState,
    toggleWrapCode,
    copyElementRef,
  } = useCodeButtonGroup(wrapCodeProp);
  const [expanded, setExpanded] = useState(false);
  const [needFold, setNeedFold] = useState(false);
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!effectiveFold || !contentRef.current) {
      setNeedFold(false);
      return;
    }
    const realHeight = contentRef.current.scrollHeight;
    setNeedFold(realHeight > (effectiveHeight ?? DEFAULT_FOLD_HEIGHT));
  }, [effectiveFold, effectiveHeight]);

  const handleFoldToggle = useCallback(() => {
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
          wrapCodeState && 'rp-codeblock__content--wrap-code',
          lineNumbersProp && 'rp-codeblock__content--line-numbers',
          needFold && !expanded && 'rp-codeblock__content--fold',
          hasFixedHeight && 'rp-codeblock__content--fixed-height',
        )}
        style={
          needFold && !expanded
            ? { maxHeight: `${effectiveHeight}px` }
            : hasFixedHeight
              ? { height: `${effectiveHeight}px` }
              : undefined
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
          wrapCode={wrapCodeState}
          toggleWrapCode={toggleWrapCode}
        />
      </div>
      {needFold && (
        <button
          type="button"
          className={clsx(
            'rp-codeblock__fold-btn',
            expanded && 'rp-codeblock__fold-btn--expanded',
          )}
          onClick={handleFoldToggle}
          aria-label={expanded ? 'Collapse code' : 'Expand code'}
          aria-expanded={expanded}
        >
          <SvgWrapper
            icon={IconArrowDown}
            className="rp-codeblock__fold-btn__icon"
          />
        </button>
      )}
    </div>
  );
}
