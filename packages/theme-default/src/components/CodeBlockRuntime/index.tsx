import { useEffect, useState } from 'react';
import { codeToHtml, createCssVariablesTheme } from 'shiki';

export interface CodeBlockRuntimeProps {
  lang: string;
  title?: string;
  code: string;
}

const cssVariablesTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

export function CodeBlockRuntime({ lang, title, code }: CodeBlockRuntimeProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    const highlightCode = async () => {
      setHtml(
        await codeToHtml(code, {
          lang,
          theme: cssVariablesTheme,
        }),
      );
    };
    void highlightCode();
  }, [lang, code]);

  return (
    <div className={`language-${lang}`}>
      {title && <div className="rspress-code-title">{title}</div>}
      <div
        className="rspress-code-content rspress-scrollbar"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: intended
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    </div>
  );
}
