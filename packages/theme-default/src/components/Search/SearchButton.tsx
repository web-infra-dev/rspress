import { useLocaleSiteData } from '@rspress/runtime';
import SearchSvg from '@theme-assets/search';
import { useEffect, useState } from 'react';
import { SvgWrapper } from '../SvgWrapper';
import './SearchButton.scss';

export interface SearchButtonProps {
  setFocused: (focused: boolean) => void;
}

export function SearchButton({ setFocused }: SearchButtonProps) {
  const [metaKey, setMetaKey] = useState<null | string>(null);
  const { searchPlaceholderText = 'Search' } = useLocaleSiteData();
  useEffect(() => {
    setMetaKey(
      /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl',
    );
  }, []);
  return (
    <>
      <button className="rp-search-button" onClick={() => setFocused(true)}>
        <div className="rp-search-button__content">
          <SvgWrapper icon={SearchSvg} className="rp-search-button__icon" />
          <span className="rp-search-button__word">
            {searchPlaceholderText}
          </span>
        </div>
        <div
          className="rp-search-button__hotkey"
          style={{ opacity: metaKey ? 1 : 0 }}
        >
          <span>{metaKey}</span>
          <span>K</span>
        </div>
      </button>
      <div
        className="rp-search-button--mobile"
        onClick={() => setFocused(true)}
      >
        <SvgWrapper icon={SearchSvg} />
      </div>
    </>
  );
}
