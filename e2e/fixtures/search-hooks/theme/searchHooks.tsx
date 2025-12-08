import type { RenderSearchFunction } from '@rspress/core/theme-original';
import {
  type BeforeSearch,
  type OnSearch,
  RenderType,
} from '@rspress/core/theme-original';

const onSearch: OnSearch = async (query, defaultSearchResult) => {
  const { result } = defaultSearchResult[0];
  console.info('onSearch', query);
  return [
    {
      group: 'All',
      result,
      renderType: RenderType.Default,
    },
    {
      group: 'Custom',
      result: {
        list: [
          {
            title: 'Search Result 1',
            path: '/search1',
          },
          {
            title: 'Search Result 2',
            path: '/search2',
          },
        ],
      },
      renderType: RenderType.Custom,
    },
  ];
};

export { onSearch };

const beforeSearch: BeforeSearch = (query: string) => {
  const replaced = query.replace(' ', '');
  console.info('beforeSearch', replaced);
  return replaced;
};

interface ResultData {
  list: {
    title: string;
    path: string;
  }[];
}

const render: RenderSearchFunction<ResultData> = item => {
  return (
    <div>
      {item.list.map(i => (
        <div key={i.path}>
          <a id={i.path} href={i.path}>
            {i.title}
          </a>
        </div>
      ))}
    </div>
  );
};

export { beforeSearch, render };
