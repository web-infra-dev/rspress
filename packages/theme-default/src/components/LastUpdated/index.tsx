import { useLocaleSiteData, usePageData } from '@rspress/runtime';

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
