import type { CodeBlockProps } from '@theme';
import { getCustomMDXComponent } from '@theme';
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

export interface CodeBlockRuntimeProps extends CodeBlockProps {
  lang: string;
  code: string;
  shikiOptions?: Omit<
    CodeToHastOptions<BundledLanguage, BundledTheme>,
    'lang' | 'theme'
  >;
  /**
   * Callback when the code block is rendered.
   * For some DOM operations, such as scroll operations.
   */
  onRendered?: () => void;
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
  codeButtonGroupProps,
  children: _,
  containerElementClassName,
  onRendered,
  ...otherProps
}: CodeBlockRuntimeProps) {
  const [child, setChild] = useState<ReactNode | null>(null);
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

      const {
        pre: ShikiPre,
        code: Code,
        ...otherMdxComponents
      } = getCustomMDXComponent();

      const reactNode = toJsxRuntime(hast, {
        jsx,
        jsxs,
        development: false,
        components: {
          ...otherMdxComponents,
          pre: props => (
            <ShikiPre
              title={title}
              lang={lang}
              containerElementClassName={containerElementClassName}
              codeButtonGroupProps={codeButtonGroupProps}
              {...props}
              {...otherProps}
            />
          ),
          code: props => <Code {...props} />,
        },
        Fragment,
      });

      setChild(reactNode);
    };
    void highlightCode();
  }, [lang, code, shikiOptions]);

  useEffect(() => {
    if (child) {
      onRendered?.();
    }
  }, [child]);

  return child;
}
