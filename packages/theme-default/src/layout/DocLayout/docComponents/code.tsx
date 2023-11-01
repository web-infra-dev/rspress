import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import languagesInfo from 'virtual-prism-languages';
import copy from 'copy-to-clipboard';
import { useRef } from 'react';
import { usePageData } from '@rspress/runtime';
import style from './prisim-theme';

let registered = false;
const timeoutIdMap: Map<HTMLElement, NodeJS.Timeout> = new Map();

export interface CodeProps {
  children: string;
  className?: string;
  meta?: string;
}

function registerLanguages() {
  Object.keys(languagesInfo).forEach(key => {
    SyntaxHighlighter.registerLanguage(key, languagesInfo[key]);
  });
  registered = true;
}

export function Code(props: CodeProps) {
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const { siteData } = usePageData();
  const { showLineNumbers } = siteData.markdown;
  if (!registered) {
    registerLanguages();
  }
  const { className, meta } = props;
  const language = className?.replace(/language-/, '');
  if (!language) {
    return <code {...props}></code>;
  }
  let children: string;
  if (typeof props.children === 'string') {
    children = props.children.trim();
  } else if (Array.isArray(props.children)) {
    children = (props.children[0] as string).trim();
  } else {
    children = '';
  }
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

  const copyCode = () => {
    const isCopied = copy(children);
    const el = copyButtonRef.current;

    if (isCopied && el) {
      el.classList.add('copied');
      clearTimeout(timeoutIdMap.get(el));
      const timeoutId = setTimeout(() => {
        el.classList.remove('copied');
        el.blur();
        timeoutIdMap.delete(el);
      }, 2000);
      timeoutIdMap.set(el, timeoutId);
    }
  };

  return (
    <>
      <SyntaxHighlighter
        language={language}
        style={style}
        wrapLines={true}
        className="code"
        customStyle={{ backgroundColor: 'inherit' }}
        // Notice: if the highlight line is specified, the line number must be displayed
        showLineNumbers={showLineNumbers || highlightLines.length > 0}
        lineProps={lineNumber => {
          const isHighlighted = highlightLines.includes(lineNumber);
          return {
            className: isHighlighted ? 'line highlighted' : '',
            style: {
              backgroundColor: isHighlighted
                ? 'var(--rp-code-line-highlight-color)'
                : '',
              display: 'block',
              padding: '0 1.25rem',
            },
          };
        }}
      >
        {children}
      </SyntaxHighlighter>
      <button className="copy" onClick={copyCode} ref={copyButtonRef}></button>
    </>
  );
}
