import {
  HomeLayout as BasicHomeLayout,
  Layout as BasicLayout,
  getCustomMDXComponent as basicGetCustomMDXComponent,
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
import { Announcement } from '@rstack-dev/doc-ui/announcement';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import { ToolStack } from './components/ToolStack';

import './index.css';
import { NoSSR, useLang } from '@rspress/core/runtime';

function HomeLayout() {
  const { pre: PreWithCodeButtonGroup, code: Code } =
    basicGetCustomMDXComponent();
  return (
    <BasicHomeLayout
      afterFeatures={<ToolStack />}
      afterHeroActions={
        <div
          className="rspress-doc"
          style={{ minHeight: 'auto', width: '100%', maxWidth: 400 }}
        >
          <PreWithCodeButtonGroup
            containerElementClassName="language-bash"
            codeButtonGroupProps={{
              showCodeWrapButton: false,
            }}
          >
            <Code className="language-bash" style={{ textAlign: 'center' }}>
              npm create rspress@beta
            </Code>
          </PreWithCodeButtonGroup>
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
