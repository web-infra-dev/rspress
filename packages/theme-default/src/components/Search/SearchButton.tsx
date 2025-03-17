import SearchSvg from '@theme-assets/search';
import { useEffect, useState } from 'react';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
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
    <>
      <div
        className={`rspress-nav-search-button ${styles.navSearchButton}`}
        onClick={() => setFocused(true)}
      >
        <button>
          <SvgWrapper icon={SearchSvg} width="18" height="18" />
          <p className={styles.searchWord}>{searchPlaceholderText}</p>
          <div style={{ opacity: metaKey ? 1 : 0 }}>
            <span>{metaKey}</span>
            <span>K</span>
          </div>
        </button>
      </div>
      <div
        className={styles.mobileNavSearchButton}
        onClick={() => setFocused(true)}
      >
        <SvgWrapper icon={SearchSvg} />
      </div>
    </>
  );
}
