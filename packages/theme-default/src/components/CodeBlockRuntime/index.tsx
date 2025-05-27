import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import {
  type BundledLanguage,
  type BundledTheme,
  type CodeToHastOptions,
  codeToHast,
  createCssVariablesTheme,
} from 'shiki';

import { getCustomMDXComponent } from '@theme';
import { Code } from '../../layout/DocLayout/docComponents/code';
import {
  PreWithCodeButtonGroup,
  type PreWithCodeButtonGroupProps,
} from '../../layout/DocLayout/docComponents/pre';

export interface CodeBlockRuntimeProps extends PreWithCodeButtonGroupProps {
  lang: string;
  code: string;
  shikiOptions?: Omit<
    CodeToHastOptions<BundledLanguage, BundledTheme>,
    'lang' | 'theme'
  >;
}

const cssVariablesTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

const useLatest = <T,>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

export function CodeBlockRuntime({
  lang,
  title,
  code,
  shikiOptions,
  ...otherProps
}: CodeBlockRuntimeProps) {
  const [child, setChild] = useState<ReactNode>('');
  const codeRef = useLatest(code);

  useEffect(() => {
    const highlightCode = async () => {
      const hast = await codeToHast(code, {
        lang,
        theme: cssVariablesTheme,
        ...shikiOptions,
      });

      // 1. for async race condition, only set child if the code is still the same
      // 2. string comparison consumes too much performance, so only comparing the string length
      if (codeRef.current.length !== code.length) {
        return;
      }

      const reactNode = toJsxRuntime(hast, {
        jsx,
        jsxs,
        development: false,
        components: {
          ...getCustomMDXComponent(),
          // implement `addLanguageClass: true`
          pre: props => (
            <PreWithCodeButtonGroup
              title={title}
              containerElementClassName={`language-${lang}`}
              {...props}
              {...otherProps}
            />
          ),
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
  }, [lang, code, shikiOptions]);

  return child;
}
