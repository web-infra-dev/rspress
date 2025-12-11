import {
  CodeButtonGroup,
  type CodeButtonGroupProps,
  useCodeButtonGroup,
} from '@theme';
import clsx from 'clsx';
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
  codeButtonGroupProps,
  children,
}: CodeBlockProps) {
  const { codeWrap, toggleCodeWrap, copyElementRef } =
    useCodeButtonGroup(wrapCodeProp);
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
        className={clsx(
          'rp-codeblock__content',
          codeWrap && 'rp-codeblock__content--code-wrap',
          lineNumbersProp && 'rp-codeblock__content--line-numbers',
        )}
      >
        <div
          className="rp-codeblock__content__scroll-container rp-scrollbar"
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
    </div>
  );
}
