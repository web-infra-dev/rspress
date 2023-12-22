import type {
  BeforeSearch,
  OnSearch,
  AfterSearch,
  RenderSearchFunction,
} from 'rspress/theme';

interface ResultData {
  list: {
    title: string;
    path: string;
  }[];
}

const beforeSearch: BeforeSearch = (query: string) => {
  // 可以在这里做一些搜索前的操作
  console.log('beforeSearch');
  // 返回处理后的 query
  return query.replace(' ', '');
};

const onSearch: OnSearch = async (query, defaultSearchResult) => {
  // 可根据 query 请求数据
  console.log(query);
  // 默认的搜索源的结果，为一个数组
  console.log(defaultSearchResult);
  // const customResult = await searchQuery(query);

  // 返回值为一个数组，数组中的每一项为一个搜索源的结果
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
    },
  ];
};

const afterSearch: AfterSearch = async (query, result) => {
  // 可以在这里做一些搜索后的操作
  console.log('afterSearch', query, result);
};

// 针对每一个搜索源的渲染函数
const render: RenderSearchFunction<ResultData> = item => {
  return (
    <div>
      {item.list.map(i => (
        <div>
          <a href={i.path}>{i.title}</a>
        </div>
      ))}
    </div>
  );
};

export { beforeSearch, onSearch, afterSearch, render };
