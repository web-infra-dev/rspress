import { DocSearch } from '@docsearch/react';
import type { DocSearchProps } from '@docsearch/react';
import { useLang, useNavigate } from '@rspress/core/runtime';
// @ts-ignore @theme is not typed
import { Link } from '@theme';
import '@docsearch/css';
import './Search.css';
import { useEffect } from 'react';
import type { Locales } from './locales';

const Hit: DocSearchProps['hitComponent'] = ({ hit, children }) => {
  return <Link href={hit.url}>{children}</Link>;
};

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

  useEffect(() => {
    const preconnect = document.createElement('link');
    const appId = docSearchProps.appId;
    preconnect.id = appId;
    preconnect.rel = 'preconnect';
    preconnect.href = `https://${appId}-dsn.algolia.net`;
    preconnect.crossOrigin = '';
    document.head.appendChild(preconnect);
    return () => {
      document.head.removeChild(preconnect);
    };
  }, [docSearchProps.appId]);

  return (
    <>
      <DocSearch
        placeholder={placeholder}
        translations={translations}
        maxResultsPerGroup={20}
        navigator={{
          navigate({ itemUrl }) {
            navigate(itemUrl);
          },
        }}
        transformItems={(items: any[]) => {
          return items.map(item => {
            const url = new URL(item.url);
            return {
              ...item,
              url: item.url.replace(url.origin, ''),
            };
          });
        }}
        hitComponent={Hit}
        {...docSearchProps}
      />
    </>
  );
}

export { Search };
export type { SearchProps };
