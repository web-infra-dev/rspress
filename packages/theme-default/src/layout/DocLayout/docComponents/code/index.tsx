import { usePageData } from '@rspress/runtime';
import IconWrap from '@theme-assets/wrap';
import IconWrapped from '@theme-assets/wrapped';
import { useRef, useState } from 'react';
import { SvgWrapper } from '../../../../components/SvgWrapper';
import { CopyCodeButton } from './CopyCodeButton';
import { PrismSyntaxHighlighter } from './PrismSyntaxHighlighter';
import * as styles from './index.module.scss';

export interface CodeProps {
  children: string;
  className?: string;
  codeHighlighter?: 'prism' | 'shiki';
  meta?: string;
}

export function Code(props: CodeProps) {
  const { siteData } = usePageData();
  const codeHighlighter =
    props.codeHighlighter ?? siteData.markdown.codeHighlighter;
  const { defaultWrapCode } = siteData.markdown;
  const [codeWrap, setCodeWrap] = useState(defaultWrapCode);
  const wrapButtonRef = useRef<HTMLButtonElement>(null);
  const codeBlockRef = useRef<HTMLDivElement>(null);

  const { className } = props;
  const language = className?.replace(/language-/, '');

  if (!language) {
    return <code {...props}></code>;
  }

  if (codeHighlighter === 'shiki') {
    return <code {...props}></code>;
  }

  const toggleCodeWrap = (wrapButtonElement: HTMLButtonElement | null) => {
    if (codeWrap) {
      wrapButtonElement?.classList.remove(styles.wrappedBtn);
    } else {
      wrapButtonElement?.classList.add(styles.wrappedBtn);
    }
    setCodeWrap(!codeWrap);
  };

  return (
    <>
      {/* Use prism.js to highlight code by default */}
      <div ref={codeBlockRef}>
        <PrismSyntaxHighlighter
          {...props}
          language={language}
          codeWrap={codeWrap}
        />
      </div>
      <div className={styles.codeButtonGroup}>
        <button
          ref={wrapButtonRef}
          onClick={() => toggleCodeWrap(wrapButtonRef.current)}
          title="Toggle code wrap"
        >
          <SvgWrapper icon={IconWrapped} className={styles.iconWrapped} />
          <SvgWrapper icon={IconWrap} className={styles.iconWrap} />
        </button>
        <CopyCodeButton codeBlockRef={codeBlockRef} />
      </div>
    </>
  );
}
