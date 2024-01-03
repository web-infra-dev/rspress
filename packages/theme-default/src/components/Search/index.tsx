import { useEffect, useState } from 'react';
import SearchSvg from './assets/search.svg';
import styles from './index.module.scss';
import { SearchPanel } from './SearchPanel';

export function Search() {
  const [focused, setFocused] = useState(false);
  const [metaKey, setMetaKey] = useState<null | string>(null);

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
          <SearchSvg width="18" hight="18" />
          <p className={styles.searchWord}>Search Docs</p>
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
        <SearchSvg />
      </div>
      <SearchPanel focused={focused} setFocused={setFocused} />
    </>
  );
}

export { SearchPanel };
