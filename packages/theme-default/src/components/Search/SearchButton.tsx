import { useLocaleSiteData } from '@rspress/runtime';
import SearchSvg from '@theme-assets/search';
import { useEffect, useState } from 'react';
import { SvgWrapper } from '../SvgWrapper';
import * as styles from './index.module.scss';

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
    <button
      className={`rspress-nav-search-button ${styles.navSearchButton}`}
      onClick={() => setFocused(true)}
    >
      <SvgWrapper icon={SearchSvg} width="16" height="16" />
      <kbd>{metaKey}K</kbd>
    </button>
  );
}
