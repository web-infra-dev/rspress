import { useEffect, useState } from 'react';
import SearchSvg from '@theme-assets/search';
import styles from './index.module.scss';
import { SearchPanel } from './SearchPanel';
import { SvgWrapper } from '../SvgWrapper';
import { useLocaleSiteData } from '../../logic';

export function Search() {
  const [focused, setFocused] = useState(false);
  const [metaKey, setMetaKey] = useState<null | string>(null);
  const { searchPlaceholderText = 'Search Docs' } = useLocaleSiteData();
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
      <SearchPanel focused={focused} setFocused={setFocused} />
    </>
  );
}

export { SearchPanel };
