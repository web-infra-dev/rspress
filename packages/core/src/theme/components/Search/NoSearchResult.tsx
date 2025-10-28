import { useLocaleSiteData } from '@rspress/core/runtime';
import Empty from '@theme-assets/empty';
import { SvgWrapper } from '../SvgWrapper';
import './NoSearchResult.scss';

export function NoSearchResult({ query }: { query: string }) {
  const {
    searchNoResultsText = 'No results for',
    searchSuggestedQueryText = 'Please try again with a different keyword',
  } = useLocaleSiteData();

  return (
    <div className="rp-no-search-result">
      <SvgWrapper icon={Empty} className="rp-no-search-result__icon" />
      <p className="rp-no-search-result__text">
        {searchNoResultsText} <b>&quot;{query}&quot;</b>
      </p>
      <p className="rp-no-search-result__suggestion">
        {searchSuggestedQueryText}
      </p>
    </div>
  );
}
