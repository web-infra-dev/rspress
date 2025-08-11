import { useLocaleSiteData, usePage, useSite } from '@rspress/runtime';
import { lastUpdated } from './index.module.scss';

export function LastUpdated() {
  const { lastUpdatedText: localesLastUpdatedText = 'Last Updated' } =
    useLocaleSiteData();
  const {
    page: { lastUpdatedTime },
  } = usePage();

  const { site } = useSite();

  const { themeConfig } = site;
  const lastUpdatedText =
    themeConfig?.lastUpdatedText || localesLastUpdatedText;

  return (
    <div className={lastUpdated}>
      <p>
        {lastUpdatedText}: <span>{lastUpdatedTime}</span>
      </p>
    </div>
  );
}
