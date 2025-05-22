import { usePageData } from '@rspress/runtime';
import IconWrap from '@theme-assets/wrap';
import IconWrapped from '@theme-assets/wrapped';
import { useState } from 'react';
import { SvgWrapper } from '../../../../components/SvgWrapper';
import { CopyCodeButton } from './CopyCodeButton';
import * as styles from './index.module.scss';

export interface CodeButtonGroupProps
  extends ReturnType<typeof useCodeButtonGroup> {
  preElementRef: React.RefObject<HTMLPreElement | null>;

  /**
   * @default true
   */
  showCodeWrapButton?: boolean;
  /**
   * @default true
   */
  showCopyButton?: boolean;
}

export const useCodeButtonGroup = () => {
  const { siteData } = usePageData();
  const { defaultWrapCode } = siteData.markdown;
  const [codeWrap, setCodeWrap] = useState(defaultWrapCode);

  const toggleCodeWrap = () => {
    setCodeWrap(!codeWrap);
  };

  return {
    codeWrap,
    toggleCodeWrap,
  };
};

export function CodeButtonGroup({
  codeWrap,
  toggleCodeWrap,
  preElementRef,
  showCodeWrapButton = true,
  showCopyButton = true,
}: CodeButtonGroupProps) {
  return (
    <>
      <div className={styles.codeButtonGroup}>
        {showCodeWrapButton && (
          <button
            className={codeWrap ? styles.wrappedBtn : ''}
            onClick={() => toggleCodeWrap()}
            title="Toggle code wrap"
          >
            <SvgWrapper icon={IconWrapped} className={styles.iconWrapped} />
            <SvgWrapper icon={IconWrap} className={styles.iconWrap} />
          </button>
        )}
        {showCopyButton && (
          <CopyCodeButton codeBlockRef={preElementRef as any} />
        )}
      </div>
    </>
  );
}
