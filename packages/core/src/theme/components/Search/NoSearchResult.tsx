import { useI18n } from '@rspress/core/runtime';
import { SvgWrapper } from '@theme';
import Empty from '@theme-assets/empty';
import './NoSearchResult.scss';

export function NoSearchResult({ query }: { query: string }) {
  const t = useI18n();

  return (
    <div className="rp-no-search-result">
      <SvgWrapper icon={Empty} className="rp-no-search-result__icon" />
      <p className="rp-no-search-result__text">
        {t('searchNoResultsText')} <b>&quot;{query}&quot;</b>
      </p>
      <p className="rp-no-search-result__suggestion">
        {t('searchSuggestedQueryText')}
      </p>
    </div>
  );
}
