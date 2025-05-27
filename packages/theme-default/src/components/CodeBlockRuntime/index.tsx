import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, type ReactNode, useEffect, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { codeToHast, createCssVariablesTheme } from 'shiki';

import { getCustomMDXComponent } from '@theme';
import { Code } from '../../layout/DocLayout/docComponents/code';
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
          pre: props => (
            <PreWithCodeButtonGroup
              title={title}
              containerElementClassName={`language-${lang}`}
              {...props}
            />
          ),
          // addLanguageClass: true,
          code: ({ className, ...otherProps }) => (
            <Code
              {...otherProps}
              className={[className, `language-${lang}`]
                .filter(Boolean)
                .join(' ')}
            />
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
