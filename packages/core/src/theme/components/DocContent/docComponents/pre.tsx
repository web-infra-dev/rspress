import { CodeBlock, type CodeBlockProps } from '@theme';

export type ShikiPreProps = CodeBlockProps &
  React.HTMLAttributes<HTMLPreElement>;

export function ShikiPre({
  title,
  lang,
  wrapCode,
  lineNumbers,
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
      containerElementClassName={containerElementClassName}
      codeButtonGroupProps={codeButtonGroupProps}
    >
      <pre {...otherProps} />
    </CodeBlock>
  );
}
