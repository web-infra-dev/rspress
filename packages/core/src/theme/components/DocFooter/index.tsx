import { useLocaleSiteData, useSite } from '@rspress/core/runtime';
import { LastUpdated, PrevNextPage } from '@theme';
import './index.scss';

export function DocFooter() {
  const { lastUpdated: localesLastUpdated = false } = useLocaleSiteData();
  const { site } = useSite();
  const { themeConfig } = site;
  const showLastUpdated = themeConfig.lastUpdated || localesLastUpdated;

  return (
    <footer className="rp-doc-footer">
      {showLastUpdated && <LastUpdated />}
      <div className="rp-divider" />
      <PrevNextPage />
    </footer>
  );
}
