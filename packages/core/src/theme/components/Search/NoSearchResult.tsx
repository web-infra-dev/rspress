import { useI18n } from '@rspress/core/runtime';
import { IconEmpty, SvgWrapper } from '@theme';
import './NoSearchResult.scss';

export function NoSearchResult({ query }: { query: string }) {
  const t = useI18n();

  return (
    <div className="rp-no-search-result">
      <SvgWrapper icon={IconEmpty} className="rp-no-search-result__icon" />
      <p className="rp-no-search-result__text">
        {t('searchNoResultsText')} <b>&quot;{query}&quot;</b>
      </p>
      <p className="rp-no-search-result__suggestion">
        {t('searchSuggestedQueryText')}
      </p>
    </div>
  );
}
