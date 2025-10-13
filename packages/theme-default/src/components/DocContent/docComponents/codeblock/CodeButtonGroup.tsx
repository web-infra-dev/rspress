import { useSite } from '@rspress/runtime';
import IconWrap from '@theme-assets/wrap';
import IconWrapped from '@theme-assets/wrapped';
import clsx from 'clsx';
import { useState } from 'react';
import { SvgWrapper } from '../../../SvgWrapper';
import './CodeButtonGroup.scss';
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
        {showCopyButton && <CopyCodeButton codeBlockRef={preElementRef} />}
      </div>
    </>
  );
}
