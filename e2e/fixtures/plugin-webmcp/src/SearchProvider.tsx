import { usePage } from '@rspress/core/runtime';
import { registerSearchProvider } from '@rspress/core/theme';
import { useEffect } from 'react';

export default function SearchProvider() {
  const { page } = usePage();

  useEffect(() => {
    if (page.routePath !== '/provider') {
      return;
    }

    return registerSearchProvider({
      search: async (query, limit = 20) => [
        {
          group: 'fixture-provider',
          result: [
            {
              title: 'External provider result',
              link: '/provider',
              query,
            },
          ].slice(0, limit),
        },
      ],
    });
  }, [page.routePath]);

  return null;
}
