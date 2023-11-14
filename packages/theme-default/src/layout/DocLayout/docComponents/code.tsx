import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import languagesInfo from 'virtual-prism-languages';
import copy from 'copy-to-clipboard';
import { useRef, useState } from 'react';
import { usePageData } from '@rspress/runtime';
import style from './prisim-theme';

let registered = false;
const timeoutIdMap: Map<HTMLElement, NodeJS.Timeout> = new Map();

export interface CodeProps {
  children: string;
  // eslint-disable-next-line react/no-unused-prop-types
  className?: string;
  meta?: string;
}

function registerLanguages() {
  Object.keys(languagesInfo).forEach(key => {
    SyntaxHighlighter.registerLanguage(key, languagesInfo[key]);
  });
  registered = true;
}

function PrismSyntaxHighlighter(
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
      style={style}
      wrapLines={true}
      className="code"
      wrapLongLines={codeWrap}
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
      {props.children}
    </SyntaxHighlighter>
  );
}

export function Code(props: CodeProps) {
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const { siteData } = usePageData();
  const { defaultWrapCode, codeHighlighter } = siteData.markdown;
  const [codeWrap, setCodeWrap] = useState(defaultWrapCode);

  const { className } = props;
  const language = className?.replace(/language-/, '');
  if (!language) {
    return <code {...props}></code>;
  }
  let children: string;
  if (typeof props.children === 'string') {
    children = props.children.trim();
  } else if (Array.isArray(props.children)) {
    ({ children } = props);
  } else {
    children = '';
  }

  const toggleCodeWrap = () => {
    setCodeWrap(!codeWrap);
  };

  const copyCode = () => {
    const isCopied = copy(children);
    const el = copyButtonRef.current;

    if (isCopied && el) {
      copy(el.previousElementSibling.previousElementSibling.textContent);
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

  const getHighlighter = () => {
    switch (codeHighlighter) {
      case 'prism':
        return (
          <PrismSyntaxHighlighter
            {...props}
            language={language}
            codeWrap={codeWrap}
          />
        );
      case 'shiki':
      default:
        return <code {...props}></code>;
    }
  };

  return (
    <>
      {/* Use prism.js to highlight code by default */}
      {getHighlighter()}
      <button
        className={`wrap ${codeWrap ? 'wrapped' : ''}`}
        onClick={toggleCodeWrap}
      ></button>
      <button className="copy" onClick={copyCode} ref={copyButtonRef}></button>
    </>
  );
}
