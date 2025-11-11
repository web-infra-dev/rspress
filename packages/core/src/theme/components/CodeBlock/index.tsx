import {
  CodeButtonGroup,
  type CodeButtonGroupProps,
  useCodeButtonGroup,
} from '@theme';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import './index.scss';

export type CodeBlockProps = {
  title?: string;
  lang?: string;
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
  codeButtonGroupProps,
  children,
}: CodeBlockProps) {
  const { codeWrap, toggleCodeWrap, copyElementRef, setCodeWrap } =
    useCodeButtonGroup();
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if the pre element has the has-wrap-code class from the transformer
  useEffect(() => {
    if (contentRef.current) {
      const preElement = contentRef.current.querySelector('pre');
      if (preElement?.classList.contains('has-wrap-code')) {
        setCodeWrap(true);
      }
    }
  }, [setCodeWrap]);

  return (
    <div
      className={clsx(
        'rp-codeblock',
        `language-${lang}`,
        containerElementClassName,
      )}
    >
      {title && <div className="rp-codeblock__title">{title}</div>}
      <div
        ref={contentRef}
        className={clsx(
          'rp-codeblock__content',
          codeWrap && 'rp-codeblock__content--code-wrap',
        )}
      >
        <div ref={copyElementRef}>{children}</div>
        <CodeButtonGroup
          {...codeButtonGroupProps}
          copyElementRef={copyElementRef}
          codeWrap={codeWrap}
          toggleCodeWrap={toggleCodeWrap}
        />
      </div>
    </div>
  );
}
