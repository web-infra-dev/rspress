import Empty from '@theme-assets/empty';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import { SvgWrapper } from '../SvgWrapper';

export function NoSearchResult({ query }: { query: string }) {
  const {
    searchNoResultsText = 'No results for',
    searchSuggestedQueryText = 'Please try again with a different keyword',
  } = useLocaleSiteData();

  return (
    <div className="rp-flex rp-flex-col rp-items-center rp-pt-8 rp-pb-2">
      <SvgWrapper icon={Empty} className="rp-mb-4 rp-opacity-80" />
      <p className="rp-mb-2">
        {searchNoResultsText} <b>&quot;{query}&quot;</b>
      </p>
      <p>{searchSuggestedQueryText}</p>
    </div>
  );
}
