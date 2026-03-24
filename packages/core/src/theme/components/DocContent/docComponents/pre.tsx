import { CodeBlock, type CodeBlockProps } from '@rspress/core/theme';

export type ShikiPreProps = CodeBlockProps &
  React.HTMLAttributes<HTMLPreElement>;

export function ShikiPre({
  title,
  lang,
  wrapCode,
  lineNumbers,
  toggle,
  height,
  containerElementClassName,
  codeButtonGroupProps,
  ...otherProps
}: ShikiPreProps) {
  return (
    <CodeBlock
      title={title}
      lang={lang}
      wrapCode={wrapCode}
      lineNumbers={lineNumbers}
      toggle={toggle}
      height={height}
      containerElementClassName={containerElementClassName}
      codeButtonGroupProps={codeButtonGroupProps}
    >
      {/* data-lang is a meta for SSG-MD */}
      <pre {...otherProps} data-lang={lang} data-title={title} />
    </CodeBlock>
  );
}
