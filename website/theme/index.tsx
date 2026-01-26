import {
  useFrontmatter,
  useI18n,
  useLang,
  useLocation,
} from '@rspress/core/runtime';
import {
  HomeHero as BasicHomeHero,
  HomeLayout as BasicHomeLayout,
  Layout as BasicLayout,
  getCustomMDXComponent as basicGetCustomMDXComponent,
  Callout,
  type HomeHeroProps,
  Link,
  PackageManagerTabs,
} from '@rspress/core/theme-original';
import {
  Search as PluginAlgoliaSearch,
  ZH_LOCALES,
} from '@rspress/plugin-algolia/runtime';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import type { PropsWithChildren } from 'react';
import { CssModificationProvider } from '../docs/components/CssModificationContext';
import { CssModificationIndicator } from '../docs/components/CssModificationIndicator';
import { CssStyleSync } from '../docs/components/CssStyleSync';
import { HeroInteractive } from './components/HeroInteractive';
import { Tag } from './components/Tag';
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

const HomeHero = ({ image: _, ...otherProps }: HomeHeroProps) => {
  return <BasicHomeHero image={<HeroInteractive />} {...otherProps} />;
};

const Layout = () => {
  return (
    <CssModificationProvider>
      <CssStyleSync />
      <CssModificationIndicator />
      <BasicLayout beforeNavTitle={<NavIcon />} />
    </CssModificationProvider>
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
export { getCustomMDXComponent, HomeLayout, Layout, Search, Tag, HomeHero };
