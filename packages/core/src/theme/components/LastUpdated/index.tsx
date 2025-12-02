import { useI18n, usePage } from '@rspress/core/runtime';
import './index.scss';
import { PREFIX } from '../../constant';

export function LastUpdated() {
  const {
    page: { lastUpdatedTime },
  } = usePage();

  const t = useI18n();

  return (
    <div className={`${PREFIX}last-updated`}>
      <p>
        {t('lastUpdatedText')}: <span>{lastUpdatedTime}</span>
      </p>
    </div>
  );
}
