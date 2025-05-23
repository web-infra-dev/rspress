import { useEffect, useState } from 'react';
import { codeToHtml, createCssVariablesTheme } from 'shiki';

import {
  PreWithCodeButtonGroup,
  type PreWithCodeButtonGroupProps,
} from '../../layout/DocLayout/docComponents/pre';

export interface CodeBlockRuntimeProps extends PreWithCodeButtonGroupProps {
  lang: string;
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
      <PreWithCodeButtonGroup title={title}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </PreWithCodeButtonGroup>
    </div>
  );
}
