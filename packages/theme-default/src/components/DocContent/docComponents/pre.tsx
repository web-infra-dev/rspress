import { CodeBlock, type CodeBlockProps } from '@theme';

export type ShikiPreProps = CodeBlockProps &
  React.HTMLAttributes<HTMLPreElement>;

export function ShikiPre({
  title,
  lang,
  containerElementClassName,
  codeButtonGroupProps,
  ...otherProps
}: ShikiPreProps) {
  return (
    <CodeBlock
      title={title}
      lang={lang}
      containerElementClassName={containerElementClassName}
      codeButtonGroupProps={codeButtonGroupProps}
    >
      <pre {...otherProps} />
    </CodeBlock>
  );
}
