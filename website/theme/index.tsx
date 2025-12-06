import { useLang } from '@rspress/core/runtime';
import {
  Banner,
  HomeLayout as BasicHomeLayout,
  Layout as BasicLayout,
  getCustomMDXComponent as basicGetCustomMDXComponent,
  PackageManagerTabs,
} from '@rspress/core/theme';
import {
  Search as PluginAlgoliaSearch,
  ZH_LOCALES,
} from '@rspress/plugin-algolia/runtime';
import {
  LlmsContainer,
  LlmsCopyButton,
  LlmsViewOptions,
} from '@rspress/plugin-llms/runtime';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import { ToolStack } from './components/ToolStack';

function HomeLayout() {
  return (
    <BasicHomeLayout
      afterFeatures={<ToolStack />}
      afterHeroActions={
        <div
          className="rp-doc"
          style={{ width: '100%', maxWidth: 450, margin: '-1rem 0' }}
        >
          <PackageManagerTabs command="create rspress@rc" />
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
        <Banner
          href="/"
          message={
            lang === 'en'
              ? '🚧 Rspress 2.0 document is under development'
              : lang === 'ru'
                ? 'Документация Rspress 2.0 в процессе доработки'
                : '🚧 Rspress 2.0 文档还在开发中'
          }
        />
      }
    />
  );
};

const Search = () => {
  const lang = useLang();
  return (
    <PluginAlgoliaSearch
      docSearchProps={{
        appId: 'DIDX9ZTSBM', // cspell:disable-line
        apiKey: 'd33cfed9ffae0e79412cfc3785d3a67f', // cspell:disable-line
        indexName: 'rspress-v2-crawler-doc_search_rspress_v2_pages',
        searchParameters: {
          facetFilters: [`lang:${lang}`],
        },
      }}
      locales={ZH_LOCALES}
    />
  );
};

function getCustomMDXComponent() {
  const { h1: H1, ...components } = basicGetCustomMDXComponent();

  const MyH1 = ({ ...props }) => {
    return (
      <>
        <H1 {...props} />
        <LlmsContainer>
          <LlmsCopyButton />
          <LlmsViewOptions />
        </LlmsContainer>
      </>
    );
  };
  return {
    ...components,
    h1: MyH1,
  };
}

export { Layout, HomeLayout, Search, getCustomMDXComponent };
export * from '@rspress/core/theme';
