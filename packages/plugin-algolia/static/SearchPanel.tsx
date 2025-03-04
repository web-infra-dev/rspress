import { DocSearchModal, type DocSearchModalProps } from '@docsearch/react';
import { useNavigate } from '@rspress/runtime';
// @ts-ignore
import { Link } from '@theme';
import '@docsearch/css';
import React, { useCallback } from 'react';

function Hit({ hit, children }: any) {
  return <Link href={hit.url}>{children}</Link>;
}

interface SearchPanelProps {
  focused: boolean;
  setFocused: (focused: boolean) => void;
}

type PluginAlgoliaSearchPanelProps = SearchPanelProps & {
  docSearchModalProps?: DocSearchModalProps;
};

function PluginAlgoliaSearchPanel({
  focused,
  setFocused,
  docSearchModalProps,
}: PluginAlgoliaSearchPanelProps) {
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    setFocused(false);
  }, [setFocused]);

  return (
    <>
      {focused ? (
        <DocSearchModal
          onClose={handleClose}
          searchParameters={{
            hitsPerPage: 30,
            attributesToHighlight: ['headers.0', 'title', 'content'],
          }}
          initialScrollY={0}
          appId="4K97EBF08L"
          apiKey="1ed3abb77cf42427a1ceeef2d5ca83fd"
          indexName="doc_search_rspress_pages"
          navigator={{
            navigate({ itemUrl }: any) {
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
          {...docSearchModalProps}
        />
      ) : null}
    </>
  );
}

export { PluginAlgoliaSearchPanel as SearchPanel };
