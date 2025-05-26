import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, type ReactNode, useEffect, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { codeToHast, createCssVariablesTheme } from 'shiki';

import { getCustomMDXComponent } from '../../layout/DocLayout/docComponents';
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
  const [child, setChild] = useState<ReactNode>('');

  useEffect(() => {
    const highlightCode = async () => {
      const hast = await codeToHast(code, {
        lang,
        theme: cssVariablesTheme,
      });

      const reactNode = toJsxRuntime(hast, {
        jsx,
        jsxs,
        development: false,
        components: {
          ...getCustomMDXComponent(),
          pre: ({ children, ...otherProps }) => (
            <PreWithCodeButtonGroup
              title={title}
              codeElementClassName={`language-${lang}`}
              {...otherProps}
            >
              {children}
            </PreWithCodeButtonGroup>
          ),
        },
        Fragment,
      });

      setChild(reactNode);
    };
    void highlightCode();
  }, [lang, code]);

  return child;
}
