import {
  Search as PluginAlgoliaSearch,
  ZH_LOCALES,
} from '@rspress/plugin-algolia/runtime';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import { Layout as BasicLayout } from 'rspress/theme';
import { HomeLayout as BasicHomeLayout } from 'rspress/theme';
import { ToolStack } from './components/ToolStack';

import './index.css';
import { useLang } from 'rspress/runtime';

function HomeLayout() {
  return <BasicHomeLayout afterFeatures={<ToolStack />} />;
}

const Layout = () => {
  return <BasicLayout beforeNavTitle={<NavIcon />} />;
};

const Search = () => {
  const lang = useLang();
  return (
    <PluginAlgoliaSearch
      docSearchProps={{
        appId: '4K97EBF08L',
        apiKey: '1ed3abb77cf42427a1ceeef2d5ca83fd',
        indexName: 'doc_search_rspress_pages',
        searchParameters: {
          facetFilters: [`lang:${lang}`],
        },
      }}
      locales={ZH_LOCALES}
    />
  );
};

export { Layout, HomeLayout, Search };
export * from 'rspress/theme';
