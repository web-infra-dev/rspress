import { CodeBlock, type CodeBlockProps } from '@theme';

export type ShikiPreProps = CodeBlockProps &
  React.HTMLAttributes<HTMLPreElement>;

export function ShikiPre({
  containerElementClassName,
  children,
  className,
  title,
  lang,
  codeButtonGroupProps,
  ...otherProps
}: ShikiPreProps) {
  return (
    <CodeBlock
      title={title}
      lang={lang}
      codeButtonGroupProps={codeButtonGroupProps}
      containerElementClassName={containerElementClassName}
    >
      <pre {...otherProps}>{children}</pre>
    </CodeBlock>
  );
}
