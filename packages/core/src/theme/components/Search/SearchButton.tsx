import { useI18n } from '@rspress/core/runtime';
import { IconSearch, SvgWrapper } from '@rspress/core/theme';
import { useEffect, useState } from 'react';
import './SearchButton.scss';

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
      <button className="rp-search-button" onClick={() => setFocused(true)}>
        <span className="rp-search-button__content">
          <SvgWrapper icon={IconSearch} className="rp-search-button__icon" />
          <span className="rp-search-button__word">
            {t('searchPlaceholderText')}
          </span>
        </span>
        <span
          className="rp-search-button__hotkey"
          style={{ opacity: metaKey ? 1 : 0 }}
        >
          <span>{metaKey}</span>
          <span>K</span>
        </span>
      </button>
      <div
        className="rp-search-button--mobile"
        onClick={() => setFocused(true)}
      >
        <SvgWrapper icon={IconSearch} />
      </div>
    </>
  );
}
