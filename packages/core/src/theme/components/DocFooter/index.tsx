import { useSite } from '@rspress/core/runtime';
import { EditLink, LastUpdated, PrevNextPage } from '@theme';
import './index.scss';
import { PREFIX } from '../../constant';

export function DocFooter() {
  const { site } = useSite();
  const { themeConfig } = site;
  const showLastUpdated = themeConfig.lastUpdated;

  return (
    <footer className={`${PREFIX}doc-footer`}>
      <div className={`${PREFIX}doc-footer__edit`}>
        <EditLink />
        {showLastUpdated && <LastUpdated />}
      </div>
      <div className={`${PREFIX}doc-footer__divider`} />
      <PrevNextPage />
    </footer>
  );
}
