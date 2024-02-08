import { useRef, useState } from 'react';
import { usePageData } from '@rspress/runtime';
import IconWrap from '../../../../assets/wrap.svg';
import IconWrapped from '../../../../assets/wrapped.svg';
import styles from './index.module.scss';
import { PrismSyntaxHighlighter } from './PrismSytaxHighlighter';
import { CopyCodeButton } from './CopyCodeButton';

export interface CodeProps {
  children: string;
  className?: string;
  meta?: string;
}

export function Code(props: CodeProps) {
  const { siteData } = usePageData();
  const { defaultWrapCode, codeHighlighter } = siteData.markdown;
  const [codeWrap, setCodeWrap] = useState(defaultWrapCode);
  const wrapButtonRef = useRef<HTMLButtonElement>(null);
  const codeBlockRef = useRef<HTMLDivElement>();

  const { className } = props;
  const language = className?.replace(/language-/, '');

  if (!language) {
    return <code {...props}></code>;
  }

  const toggleCodeWrap = (wrapButtonElement: HTMLButtonElement) => {
    if (codeWrap) {
      wrapButtonElement?.classList.remove(styles.wrappedBtn);
    } else {
      wrapButtonElement?.classList.add(styles.wrappedBtn);
    }
    setCodeWrap(!codeWrap);
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
      <div ref={codeBlockRef}>{getHighlighter()}</div>
      <div className={styles.codeButtonGroup}>
        <button
          ref={wrapButtonRef}
          className={styles.codeWrapButton}
          onClick={() => toggleCodeWrap(wrapButtonRef.current)}
        >
          <IconWrapped className={styles.iconWrapped} />
          <IconWrap className={styles.iconWrap} />
        </button>
        <CopyCodeButton codeBlockRef={codeBlockRef} />
      </div>
    </>
  );
}
