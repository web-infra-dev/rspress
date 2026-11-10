import { useI18n, usePage, useSite } from '@rspress/core/runtime';
import './index.scss';

export function LastUpdated() {
  const {
    page: { lastUpdatedTime, lastUpdatedAuthor },
  } = usePage();
  const { site } = useSite();
  const { themeConfig } = site;
  const showLastUpdated = themeConfig.lastUpdated;

  const t = useI18n();

  if (!showLastUpdated || !lastUpdatedTime) {
    return null;
  }

  return (
    <div className="rp-last-updated">
      <p>
        {t('lastUpdatedText')}: <span>{lastUpdatedTime}</span>
        {lastUpdatedAuthor && (
          <>
            {' '}
            {t('lastUpdatedAuthorText')} <span>{lastUpdatedAuthor}</span>
          </>
        )}
      </p>
    </div>
  );
}
