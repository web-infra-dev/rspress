import { useI18n } from '@rspress/core/runtime';
import { SvgWrapper } from '@theme';
import SearchSvg from '@theme-assets/search';
import { useEffect, useState } from 'react';
import './SearchButton.scss';
import { PREFIX } from '../../constant';

export interface SearchButtonProps {
  setFocused: (focused: boolean) => void;
}

export function SearchButton({ setFocused }: SearchButtonProps) {
  const [metaKey, setMetaKey] = useState<null | string>(null);
  const t = useI18n();
  useEffect(() => {
    setMetaKey(
      /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl',
    );
  }, []);
  return (
    <>
      <button
        className={`${PREFIX}search-button`}
        onClick={() => setFocused(true)}
      >
        <div className={`${PREFIX}search-button__content`}>
          <SvgWrapper
            icon={SearchSvg}
            className={`${PREFIX}search-button__icon`}
          />
          <span className={`${PREFIX}search-button__word`}>
            {t('searchPlaceholderText')}
          </span>
        </div>
        <div
          className={`${PREFIX}search-button__hotkey`}
          style={{ opacity: metaKey ? 1 : 0 }}
        >
          <span>{metaKey}</span>
          <span>K</span>
        </div>
      </button>
      <div
        className={`${PREFIX}search-button--mobile`}
        onClick={() => setFocused(true)}
      >
        <SvgWrapper icon={SearchSvg} />
      </div>
    </>
  );
}
