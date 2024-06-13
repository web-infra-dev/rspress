import { aliases, languages } from 'virtual-prism-languages';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { usePageData } from '@rspress/runtime';
import type { CodeProps } from '.';
import prisimThemeStyle from '../prisim-theme';

let registered = false;
function registerLanguages() {
  Object.keys(languages).forEach(name => {
    SyntaxHighlighter.registerLanguage(name, languages[name]);
  });

  SyntaxHighlighter.alias(aliases);
  registered = true;
}

export function PrismSyntaxHighlighter(
  props: CodeProps & { language: string; codeWrap: boolean },
) {
  const { siteData } = usePageData();
  const { meta, language, codeWrap } = props;
  const { showLineNumbers } = siteData.markdown;
  let highlightMeta = '';
  let highlightLines: number[] = [];
  if (meta) {
    const highlightReg = /{[\d,-]*}/i;
    highlightMeta = highlightReg.exec(meta)?.[0] || '';
    if (highlightMeta) {
      highlightLines = highlightMeta
        .replace(/[{}]/g, '')
        .split(',')
        .map(item => {
          const [start, end] = item.split('-');
          if (end) {
            return Array.from(
              { length: Number(end) - Number(start) + 1 },
              (_, i) => i + Number(start),
            );
          }
          return Number(start);
        })
        .flat();
    }
  }
  if (!registered) {
    registerLanguages();
  }
  return (
    <SyntaxHighlighter
      language={language}
      style={prisimThemeStyle}
      wrapLines={true}
      className="code"
      wrapLongLines={codeWrap}
      customStyle={{ backgroundColor: 'inherit' }}
      // Notice: if the highlight line is specified, the line number must be displayed
      showLineNumbers={showLineNumbers || highlightLines.length > 0}
      lineProps={lineNumber => {
        const isHighlighted = highlightLines.includes(lineNumber);
        return {
          style: {
            ...(isHighlighted
              ? { backgroundColor: 'var(--rp-code-line-highlight-color)' }
              : {}),
            display: 'block',
            padding: '0 1.25rem',
          },
        };
      }}
    >
      {String(props.children).trim()}
    </SyntaxHighlighter>
  );
}
