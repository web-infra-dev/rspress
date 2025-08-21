import {
  RenderType,
  type BeforeSearch,
  type OnSearch,
} from '@rspress/core/theme';
import type { RenderSearchFunction } from '@rspress/core/theme';

const onSearch: OnSearch = async (query, _defaultSearchResult) => {
  console.info('onSearch', query);
  return [
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

const render: RenderSearchFunction<ResultData> = (item) => {
  return (
    <div>
      {item.list.map((i) => (
        <div>
          <a id={i.path} href={i.path}>
            {i.title}
          </a>
        </div>
      ))}
    </div>
  );
};

export { beforeSearch, render };
