import Empty from '@theme-assets/empty';
import { SvgWrapper } from '../SvgWrapper';
import { useLocaleSiteData } from '../../logic';

export function NoSearchResult({ query }: { query: string }) {
  const {
    searchNoResultsText = 'No results for',
    searchSuggestedQueryText = 'Please try again with a different keyword',
  } = useLocaleSiteData();

  return (
    <div className="flex flex-col items-center pt-8 pb-2">
      <SvgWrapper icon={Empty} className="mb-4 opacity-80" />
      <p className="mb-2">
        {searchNoResultsText} <b>&quot;{query}&quot;</b>
      </p>
      <p>{searchSuggestedQueryText}</p>
    </div>
  );
}
