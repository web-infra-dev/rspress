import { CodeBlock, type CodeBlockProps } from '@theme';

export type ShikiPreProps = CodeBlockProps &
  React.HTMLAttributes<HTMLPreElement>;

export function ShikiPre({
  title,
  lang,
  wrapCode,
  containerElementClassName,
  codeButtonGroupProps,
  ...otherProps
}: ShikiPreProps) {
  return (
    <CodeBlock
      title={title}
      lang={lang}
      wrapCode={wrapCode}
      containerElementClassName={containerElementClassName}
      codeButtonGroupProps={codeButtonGroupProps}
    >
      <pre {...otherProps} />
    </CodeBlock>
  );
}
