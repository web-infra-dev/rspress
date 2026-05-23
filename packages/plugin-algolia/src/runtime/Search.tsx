import type { DocSearchProps } from '@docsearch/react';
import { DocSearch } from '@docsearch/react';
import { removeBase, useLang, useNavigate } from '@rspress/core/runtime';
// @ts-expect-error @theme is not typed
import { Link } from '@theme';
import '@docsearch/css';
import './Search.css';
import { preconnect } from 'react-dom';
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

  const appId = docSearchProps.appId;
  if (appId) {
    preconnect(`https://${appId}-dsn.algolia.net`, { crossOrigin: '' });
  }

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
