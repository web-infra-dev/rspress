import type { DocSearchProps } from '@docsearch/react';
import { DocSearch } from '@docsearch/react';
import { removeBase, useLang, useNavigate } from '@rspress/core/runtime';
// @ts-expect-error @theme is not typed
import { Link } from '@theme';
import '@docsearch/css';
import './Search.css';
import { useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import type { Locales } from './locales';

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
  const navigate = useNavigate();

  const lang = useLang();
  const { translations, placeholder } = locales?.[lang] ?? {};

  const appId = docSearchProps.appId;
  if (appId) {
    const algoliaUrl = `https://${appId}-dsn.algolia.net`;

    if (typeof safePreconnect === 'function') {
      safePreconnect(algoliaUrl, { crossOrigin: '' });
    }
  }

  useEffect(() => {
    if (!appId || typeof safePreconnect === 'function') {
      return;
    }

    const algoliaUrl = `https://${appId}-dsn.algolia.net`;
    const preconnect = document.createElement('link');
    preconnect.id = appId;
    preconnect.rel = 'preconnect';
    preconnect.href = algoliaUrl;
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
        transformItems={(items: any[]) => {
          return items.map(item => {
            const url = new URL(item.url);
            return {
              ...item,
              // we already have basename, so pass the url without base to Link and navigate
              url: removeBase(item.url.replace(url.origin, '')),
            };
          });
        }}
        hitComponent={Hit}
        {...docSearchProps}
      />
    </>
  );
}

export type { SearchProps };
export { Search };
