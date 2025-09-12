import { useSite } from '@rspress/runtime';
import IconWrap from '@theme-assets/wrap';
import IconWrapped from '@theme-assets/wrapped';
import { useState } from 'react';
import { SvgWrapper } from '../../../../components/SvgWrapper';
import * as styles from './CodeButtonGroup.module.scss';
import { CopyCodeButton } from './CopyCodeButton';

export interface CodeButtonGroupProps extends ReturnType<typeof useCodeWrap> {
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

export const useCodeWrap = () => {
  const { site } = useSite();
  const { defaultWrapCode } = site.markdown;
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
        {showCopyButton && <CopyCodeButton codeBlockRef={preElementRef} />}
      </div>
    </>
  );
}
