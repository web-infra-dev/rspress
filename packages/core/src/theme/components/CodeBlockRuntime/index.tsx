import type { CodeBlockProps } from '@theme';
import { getCustomMDXComponent } from '@theme';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import {
  Fragment,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  wrapCode,
  lineNumbers,
}: CodeBlockRuntimeProps) {
  // getCustomMDXComponent is stable for theme rendering
  const mdxComponents = useMemo(() => getCustomMDXComponent(), []);
  const { pre: ShikiPre, code: Code, ...otherMdxComponents } = mdxComponents;
  const fallback = useMemo(
    () => (
      <ShikiPre
        title={title}
        lang={lang}
        wrapCode={wrapCode}
        lineNumbers={lineNumbers}
        containerElementClassName={containerElementClassName}
        codeButtonGroupProps={codeButtonGroupProps}
        className="shiki css-variables"
      >
        <Code style={{ padding: '1rem 1.25rem' }}>{code}</Code>
      </ShikiPre>
    ),
    [
      ShikiPre,
      Code,
      title,
      lang,
      wrapCode,
      lineNumbers,
      containerElementClassName,
      codeButtonGroupProps,
      code,
    ],
  );
  const [child, setChild] = useState<ReactNode | null>(fallback);
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
          ...otherMdxComponents,
          pre: props => (
            <ShikiPre
              title={title}
              lang={lang}
              containerElementClassName={containerElementClassName}
              codeButtonGroupProps={codeButtonGroupProps}
              wrapCode={wrapCode}
              lineNumbers={lineNumbers}
              {...props}
            />
          ),
          code: props => <Code {...props} />,
        },
        Fragment,
      });

      setChild(reactNode);
    };
    void highlightCode();
  }, [
    code,
    codeButtonGroupProps,
    containerElementClassName,
    fallback,
    lang,
    lineNumbers,
    shikiOptions,
    title,
    wrapCode,
  ]);

  useEffect(() => {
    if (child) {
      onRendered?.();
    }
  }, [child]);

  return child;
}
