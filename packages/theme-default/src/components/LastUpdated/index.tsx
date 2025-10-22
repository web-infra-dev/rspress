import { useLocaleSiteData, usePage, useSite } from '@rspress/runtime';
import './index.scss';

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
    <div className="rp-last-updated">
      <p>
        {lastUpdatedText}: <span>{lastUpdatedTime}</span>
      </p>
    </div>
  );
}
