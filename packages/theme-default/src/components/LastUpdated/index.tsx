import { useLocaleSiteData, usePage, useSite } from '@rspress/runtime';

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
    <div className="rp-flex rp-text-sm rp-text-text-2 rp-leading-6 sm:rp-leading-8 rp-font-medium">
      <p>
        {lastUpdatedText}: <span>{lastUpdatedTime}</span>
      </p>
    </div>
  );
}
