import { useSite } from '@rspress/core/runtime';
import { IconWrap, IconWrapped, SvgWrapper } from '@rspress/core/theme';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import './index.scss';
import { CopyCodeButton } from './CopyCodeButton';

export interface CodeButtonGroupProps {
  copyElementRef: React.RefObject<HTMLDivElement | null>;
  wrapCode: boolean;
  toggleWrapCode: () => void;
  /**
   * @default true
   */
  showWrapCodeButton?: boolean;
  /**
   * @default true
   */
  showCopyButton?: boolean;
}

export const useCodeButtonGroup = (initialWrapCode?: boolean) => {
  const { site } = useSite();
  const { defaultWrapCode } = site.markdown;
  const [wrapCode, setWrapCode] = useState(initialWrapCode ?? defaultWrapCode);
  const copyElementRef = useRef<HTMLDivElement>(null);

  const toggleWrapCode = () => {
    setWrapCode(!wrapCode);
  };

  return {
    copyElementRef,
    wrapCode,
    toggleWrapCode,
  };
};

export function CodeButtonGroup({
  wrapCode,
  toggleWrapCode,
  copyElementRef,
  showWrapCodeButton = true,
  showCopyButton = true,
}: CodeButtonGroupProps) {
  return (
    <>
      <div className="rp-code-button-group">
        {showWrapCodeButton && (
          <button
            className={clsx(
              'rp-code-button-group__button',
              'rp-code-wrap-button',
              wrapCode && 'rp-code-wrap-button--wrapped',
            )}
            onClick={() => toggleWrapCode()}
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
