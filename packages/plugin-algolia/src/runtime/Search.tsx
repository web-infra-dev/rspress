import type {
  DocSearchProps,
  DocSearchTransformClient,
} from '@docsearch/react';
import { DocSearch } from '@docsearch/react';
import { useLang } from '@rspress/core/runtime';
import {
  Link,
  registerSearchProvider,
  useLinkNavigate,
} from '@rspress/core/theme';
import { liteClient } from 'algoliasearch/lite';
import '@docsearch/css';
import './Search.css';
import { useEffect, useMemo } from 'react';
import * as ReactDOM from 'react-dom';
import type { Locales } from './locales';
import {
  createAlgoliaSearchProvider,
  normalizeDocSearchItems,
} from './searchProvider';

const Hit: DocSearchProps['hitComponent'] = ({ hit, children }) => {
  return <Link href={hit.url}>{children}</Link>;
};

type ReactDOMWithPreconnect = typeof ReactDOM & {
  preconnect?: (
    href: string,
    options?: { crossOrigin?: '' | 'anonymous' | 'use-credentials' },
  ) => void;
};

const safePreconnect = (ReactDOM as ReactDOMWithPreconnect).preconnect;

type SearchProps = {
  /**
   * @link https://docsearch.algolia.com/docs/api
   */
  docSearchProps: DocSearchProps;
  locales?: Locales;
};

function Search({ locales = {}, docSearchProps }: SearchProps) {
  const navigate = useLinkNavigate();

  const lang = useLang();
  const { translations, placeholder } = locales?.[lang] ?? {};

  const appId = docSearchProps.appId;
  const searchClient = useMemo(() => {
    const client = liteClient(docSearchProps.appId, docSearchProps.apiKey);
    return (docSearchProps.transformSearchClient?.(client) ??
      client) as DocSearchTransformClient;
  }, [
    docSearchProps.appId,
    docSearchProps.apiKey,
    docSearchProps.transformSearchClient,
  ]);
  const searchProvider = useMemo(
    () => createAlgoliaSearchProvider(docSearchProps, searchClient),
    [docSearchProps, searchClient],
  );

  useEffect(
    () => (searchProvider ? registerSearchProvider(searchProvider) : undefined),
    [searchProvider],
  );

  if (appId) {
    if (typeof safePreconnect === 'function') {
      safePreconnect(`https://${appId}-dsn.algolia.net`, { crossOrigin: '' });
    }
  }

  // React 18 does not expose ReactDOM.preconnect, so keep the
  // client-side preconnect fallback for older React versions.
  useEffect(() => {
    if (!appId || typeof safePreconnect === 'function') {
      return;
    }

    const preconnect = document.createElement('link');
    preconnect.id = appId;
    preconnect.rel = 'preconnect';
    preconnect.href = `https://${appId}-dsn.algolia.net`;
    preconnect.crossOrigin = '';
    document.head.appendChild(preconnect);
    return () => {
      document.head.removeChild(preconnect);
    };
  }, [appId]);

  return (
    <>
      <DocSearch
        placeholder={placeholder}
        translations={translations}
        maxResultsPerGroup={20}
        navigator={{
          navigate({ itemUrl }: { itemUrl: string }) {
            navigate(itemUrl);
          },
        }}
        hitComponent={Hit}
        {...docSearchProps}
        transformItems={
          docSearchProps.transformItems ?? normalizeDocSearchItems
        }
        transformSearchClient={() => searchClient}
      />
    </>
  );
}

export type { SearchProps };
export { Search };
