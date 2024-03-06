import Empty from '@theme-assets/empty';
import { SvgWrapper } from '../SvgWrapper';

export function NoSearchResult({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center pt-8 pb-2">
      <SvgWrapper icon={Empty} className="mb-4 opacity-80" />
      <p className="mb-2">
        No results for <b>&quot;{query}&quot;</b>.
      </p>
      <p>Please try again with a different keyword.</p>
    </div>
  );
}
