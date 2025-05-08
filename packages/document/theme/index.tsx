import {
  Search as PluginAlgoliaSearch,
  ZH_LOCALES,
} from '@rspress/plugin-algolia/runtime';
import { Announcement } from '@rstack-dev/doc-ui/announcement';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import {
  HomeLayout as BasicHomeLayout,
  Layout as BasicLayout,
  getCustomMDXComponent,
} from 'rspress/theme';
import { ToolStack } from './components/ToolStack';

import './index.css';
import { NoSSR, useLang } from 'rspress/runtime';

function HomeLayout() {
  const { pre: Pre, code: Code } = getCustomMDXComponent();
  return (
    <BasicHomeLayout
      afterFeatures={<ToolStack />}
      afterHeroActions={
        <div
          className="rspress-doc"
          style={{ minHeight: 'auto', width: '100%', maxWidth: 400 }}
        >
          <Pre
            codeHighlighter="shiki"
            codeButtonGroupProps={{
              showCodeWrapButton: false,
            }}
          >
            <Code
              className="language-bash"
              codeHighlighter="shiki"
              style={{ textAlign: 'center' }}
            >
              npm create rspress@beta
            </Code>
          </Pre>
        </div>
      }
    />
  );
}

const Layout = () => {
  const lang = useLang();
  return (
    <BasicLayout
      beforeNavTitle={<NavIcon />}
      beforeNav={
        <NoSSR>
          <Announcement
            href="/"
            message={
              lang === 'en'
                ? '🚧 Rspress 2.0 document is under development'
                : '🚧 Rspress 2.0 文档还在开发中'
            }
            localStorageKey="rspress-announcement-closed"
          />
        </NoSSR>
      }
    />
  );
};

const Search = () => {
  const lang = useLang();
  return (
    <PluginAlgoliaSearch
      docSearchProps={{
        appId: 'DIDX9ZTSBM',
        apiKey: 'd33cfed9ffae0e79412cfc3785d3a67f',
        indexName: 'rspress-v2-website-crawler',
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
