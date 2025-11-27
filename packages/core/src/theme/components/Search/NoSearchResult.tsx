import { useI18n } from '@rspress/core/runtime';
import { SvgWrapper } from '@theme';
import Empty from '@theme-assets/empty';
import './NoSearchResult.scss';
import { PREFIX } from '../../constant';

export function NoSearchResult({ query }: { query: string }) {
  const t = useI18n();

  return (
    <div className={`${PREFIX}no-search-result`}>
      <SvgWrapper icon={Empty} className={`${PREFIX}no-search-result__icon`} />
      <p className={`${PREFIX}no-search-result__text`}>
        {t('searchNoResultsText')} <b>&quot;{query}&quot;</b>
      </p>
      <p className={`${PREFIX}no-search-result__suggestion`}>
        {t('searchSuggestedQueryText')}
      </p>
    </div>
  );
}
