import { useSite } from '@rspress/core/runtime';
import IconWrap from '@theme-assets/wrap';
import IconWrapped from '@theme-assets/wrapped';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { SvgWrapper } from '../SvgWrapper';
import './index.scss';
import { CopyCodeButton } from './CopyCodeButton';

export interface CodeButtonGroupProps
  extends ReturnType<typeof useCodeButtonGroup> {
  copyElementRef: React.RefObject<HTMLDivElement | null>;

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
  const { site } = useSite();
  const { defaultWrapCode } = site.markdown;
  const [codeWrap, setCodeWrap] = useState(defaultWrapCode);
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
      <div className="rp-code-button-group">
        {showCodeWrapButton && (
          <button
            className={clsx(
              'rp-code-button-group__button',
              'rp-code-wrap-button',
              codeWrap && 'rp-code-wrap-button--wrapped',
            )}
            onClick={() => toggleCodeWrap()}
            title="Toggle code wrap"
          >
            <SvgWrapper
              icon={IconWrapped}
              className="rp-code-button-group__icon rp-code-button-group__icon--wrapped"
            />
            <SvgWrapper
              icon={IconWrap}
              className="rp-code-button-group__icon rp-code-button-group__icon--wrap"
            />
          </button>
        )}
        {showCopyButton && <CopyCodeButton codeBlockRef={copyElementRef} />}
      </div>
    </>
  );
}
