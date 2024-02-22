import { usePageData } from '@rspress/runtime';
import { useLocaleSiteData } from '../../logic';

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
    <div className="flex text-sm text-text-2 leading-6 sm:leading-8 font-medium">
      <p>
        {lastUpdatedText}: <span>{lastUpdatedTime}</span>
      </p>
    </div>
  );
}
