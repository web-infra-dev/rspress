import {
  useFrontmatter,
  useI18n,
  useLang,
  useLocation,
} from '@rspress/core/runtime';
import {
  DocLayout as BasicDocLayout,
  Layout as BasicLayout,
  getCustomMDXComponent as basicGetCustomMDXComponent,
  Callout,
  type DocLayoutProps,
  Link,
} from '@rspress/core/theme-original';
import {
  Search as PluginAlgoliaSearch,
  ZH_LOCALES,
} from '@rspress/plugin-algolia/runtime';
import type { PropsWithChildren } from 'react';
import { CssModificationProvider } from '../docs/components/CssModificationContext';
import { CssModificationIndicator } from '../docs/components/CssModificationIndicator';
import { CssStyleSync } from '../docs/components/CssStyleSync';
import { BlogBackButton } from './components/BlogBackButton';
import {
  BlackMythHome,
  MythNavTitle,
  MythSidebarTitle,
} from './components/BlackMyth';
import { Tag } from './components/Tag';
import './index.css';
import './blackMyth.css';

function HomeLayout() {
  return <BlackMythHome />;
}

const Layout = () => {
  return (
    <CssModificationProvider>
      <CssStyleSync />
      <CssModificationIndicator />
      <BasicLayout
        navTitle={<MythNavTitle />}
        beforeSidebar={<MythSidebarTitle />}
      />
    </CssModificationProvider>
  );
};

const DocLayout = (props: DocLayoutProps) => {
  return (
    <BasicDocLayout
      {...props}
      beforeDocContent={
        <>
          <BlogBackButton />
          {props.beforeDocContent}
        </>
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

  const MyH1 = ({ children, ...props }: PropsWithChildren) => {
    const {
      frontmatter: { tag },
    } = useFrontmatter();
    const { pathname } = useLocation();
    const isEjectOnly = pathname.includes('/ui/layout-components');
    const isNonEjectable = tag?.includes('non-ejectable');
    const t = useI18n<typeof import('i18n')>();
    const lang = useLang();

    return (
      <>
        <H1 {...props}>{children}</H1>
        {isEjectOnly ? (
          <Callout type="warning">
            {isEjectOnly ? (
              <p>
                {t('ejectOnlyDescription').split('<link>')[0]}{' '}
                <Link
                  href={`${lang === 'en' ? '' : '/zh'}/guide/basic/custom-theme`}
                >
                  {t('customThemeLink')}
                </Link>{' '}
                {t('ejectOnlyDescription').split('<link>')[1]}
              </p>
            ) : null}
          </Callout>
        ) : null}
        {isNonEjectable ? (
          <Callout type="warning">
            <p>
              {t('nonEjectableDescription').split('<link>')[0]}
              <Link
                href={`${lang === 'en' ? '' : '/zh'}/guide/basic/custom-theme`}
              >
                {' '}
                {t('customThemeLink')}
              </Link>
              {t('nonEjectableDescription').split('<link>')[1]}
            </p>
          </Callout>
        ) : null}
      </>
    );
  };
  return {
    ...components,
    h1: MyH1,
  };
}

export * from '@rspress/core/theme-original';
export { DocLayout, getCustomMDXComponent, HomeLayout, Layout, Search, Tag };
