import { useSite } from '@rspress/core/runtime';
import { SvgWrapper } from '@theme';
import IconWrap from '@theme-assets/wrap';
import IconWrapped from '@theme-assets/wrapped';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import './index.scss';
import { PREFIX } from '../../constant';
import { CopyCodeButton } from './CopyCodeButton';

export interface CodeButtonGroupProps {
  copyElementRef: React.RefObject<HTMLDivElement | null>;
  codeWrap: boolean;
  toggleCodeWrap: () => void;
  /**
   * @default true
   */
  showCodeWrapButton?: boolean;
  /**
   * @default true
   */
  showCopyButton?: boolean;
}

export const useCodeButtonGroup = (initialWrapCode?: boolean) => {
  const { site } = useSite();
  const { defaultWrapCode } = site.markdown;
  const [codeWrap, setCodeWrap] = useState(initialWrapCode ?? defaultWrapCode);
  const copyElementRef = useRef<HTMLDivElement>(null);

  const toggleCodeWrap = () => {
    setCodeWrap(!codeWrap);
  };

  return {
    copyElementRef,
    codeWrap,
    toggleCodeWrap,
  };
};

export function CodeButtonGroup({
  codeWrap,
  toggleCodeWrap,
  copyElementRef,
  showCodeWrapButton = true,
  showCopyButton = true,
}: CodeButtonGroupProps) {
  return (
    <>
      <div className={`${PREFIX}code-button-group`}>
        {showCodeWrapButton && (
          <button
            className={clsx(
              `${PREFIX}code-button-group__button`,
              `${PREFIX}code-wrap-button`,
              codeWrap && `${PREFIX}code-wrap-button--wrapped`,
            )}
            onClick={() => toggleCodeWrap()}
            title="Toggle code wrap"
          >
            <SvgWrapper
              icon={IconWrapped}
              className={`${PREFIX}code-button-group__icon rp-code-button-group__icon--wrapped`}
            />
            <SvgWrapper
              icon={IconWrap}
              className={`${PREFIX}code-button-group__icon rp-code-button-group__icon--wrap`}
            />
          </button>
        )}
        {showCopyButton && <CopyCodeButton codeBlockRef={copyElementRef} />}
      </div>
    </>
  );
}
