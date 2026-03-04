import { Search as PluginAlgoliaSearch } from '@rspress/plugin-algolia/runtime';

const Search = () => {
  return (
    <PluginAlgoliaSearch
      docSearchProps={{
        appId: 'R2IYF7ETH7',
        apiKey: '599cec31baffa4868cae4e79f180729b',
        indexName: 'docsearch',
      }}
    />
  );
};
export { Search };
export * from '@rspress/core/theme-original';
