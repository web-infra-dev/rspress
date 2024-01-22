import copy from 'copy-to-clipboard';
import { useRef, useState } from 'react';
import { usePageData } from '@rspress/runtime';
import IconCopy from '../../../../assets/copy.svg';
import IconSuccess from '../../../../assets/success.svg';
import IconWrap from '../../../../assets/wrap.svg';
import IconWrapped from '../../../../assets/wrapped.svg';
import styles from './index.module.scss';
import { PrismSyntaxHighlighter } from './PrismSytaxHighlighter';

export interface CodeProps {
  children: string;
  className?: string;
  meta?: string;
}

const timeoutIdMap: Map<HTMLElement, NodeJS.Timeout> = new Map();
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

  const toggleCodeWrap = () => {
    setCodeWrap(!codeWrap);
  };

  const copyCode = () => {
    const el = copyButtonRef.current;
    let text = '';
    const walk = document.createTreeWalker(
      el.parentElement.previousElementSibling,
      NodeFilter.SHOW_TEXT,
      null,
    );
    let node = walk.nextNode();
    while (node) {
      if (!node.parentElement.classList.contains('linenumber')) {
        text += node.nodeValue;
      }
      node = walk.nextNode();
    }

    const isCopied = copy(text);

    if (isCopied && el) {
      el.classList.add(styles.codeCopied);
      clearTimeout(timeoutIdMap.get(el));
      const timeoutId = setTimeout(() => {
        el.classList.remove(styles.codeCopied);
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
      <div className={styles.codeButtonGroup}>
        <button className={styles.codeWrapButton} onClick={toggleCodeWrap}>
          {codeWrap ? (
            <IconWrapped className={styles.iconWrapped} />
          ) : (
            <IconWrap className={styles.iconWrap} />
          )}
        </button>
        <button
          className={styles.codeCopyButton}
          onClick={copyCode}
          ref={copyButtonRef}
        >
          <IconCopy className={styles.iconCopy} />
          <IconSuccess className={styles.iconSuccess} />
        </button>
      </div>
    </>
  );
}
