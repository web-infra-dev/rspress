import { usePageData } from '@rspress/runtime';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';

export function LastUpdated() {
  const { lastUpdatedText: localesLastUpdatedText = 'Last Updated' } =
    useLocaleSiteData();
  const {
    page: { lastUpdatedTime },
    siteData,
  } = usePageData();

  const { themeConfig } = siteData;
  const lastUpdatedText =
    themeConfig?.lastUpdatedText || localesLastUpdatedText;

  return (
    <div className="rp-flex rp-text-sm rp-text-text-2 rp-leading-6 sm:rp-leading-8 rp-font-medium">
      <p>
        {lastUpdatedText}: <span>{lastUpdatedTime}</span>
      </p>
    </div>
  );
}
