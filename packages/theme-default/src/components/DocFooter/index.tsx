import {
  normalizeHrefInRuntime as normalizeHref,
  usePageData,
} from '@rspress/runtime';
import { EditLink, LastUpdated, PrevNextPage } from '@theme';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import { usePrevNextPage } from '../../logic/usePrevNextPage';
import * as styles from './index.module.scss';

export function DocFooter() {
  const { prevPage, nextPage } = usePrevNextPage();
  const { lastUpdated: localesLastUpdated = false } = useLocaleSiteData();
  const { siteData } = usePageData();
  const { themeConfig } = siteData;
  const showLastUpdated = themeConfig.lastUpdated || localesLastUpdated;

  return (
    <footer className="rp-mt-8">
      <div className="xs:rp-flex rp-pb-5 rp-px-2 rp-justify-end rp-items-center">
        {showLastUpdated && <LastUpdated />}
      </div>
      <div className="rp-flex rp-flex-col">
        <EditLink />
      </div>
      <div className="rp-flex rp-flex-col sm:rp-flex-row sm:rp-justify-around rp-gap-4 rp-pt-6">
        <div className={`${styles.prev} rp-flex rp-flex-col`}>
          {prevPage && Boolean(prevPage.text) ? (
            <PrevNextPage
              type="prev"
              text={prevPage.text}
              href={normalizeHref(prevPage.link)}
            />
          ) : null}
        </div>
        <div className={`${styles.next} rp-flex rp-flex-col`}>
          {nextPage && Boolean(nextPage.text) ? (
            <PrevNextPage
              type="next"
              text={nextPage.text}
              href={normalizeHref(nextPage.link)}
            />
          ) : null}
        </div>
      </div>
    </footer>
  );
}
