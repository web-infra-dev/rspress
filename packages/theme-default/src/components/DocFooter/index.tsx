import { useLocaleSiteData, useSite } from '@rspress/runtime';
import { LastUpdated, PrevNextPage } from '@theme';
import * as styles from './index.module.scss';

export function DocFooter() {
  const { lastUpdated: localesLastUpdated = false } = useLocaleSiteData();
  const { site } = useSite();
  const { themeConfig } = site;
  const showLastUpdated = themeConfig.lastUpdated || localesLastUpdated;

  return (
    <footer className={styles.docFooter}>
      {showLastUpdated && <LastUpdated />}
      <div className={styles.divider} />
      <PrevNextPage />
    </footer>
  );
}
