import { useSite } from '@rspress/core/runtime';
import { EditLink, LastUpdated, PrevNextPage } from '@theme';
import './index.scss';

export function DocFooter() {
  const { site } = useSite();
  const { themeConfig } = site;
  const showLastUpdated = themeConfig.lastUpdated;

  return (
    <footer className="rp-doc-footer">
      {showLastUpdated && <LastUpdated />}
      <EditLink />
      <div className="rp-doc-footer__divider" />
      <PrevNextPage />
    </footer>
  );
}
