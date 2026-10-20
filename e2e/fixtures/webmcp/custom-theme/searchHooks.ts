export const beforeSearch = (query: string) => {
  if (query === 'fail') throw new Error('Search hook failed');
  return query === 'alias' ? 'cobalt' : query;
};

export const onSearch = (query: string) => {
  if (query !== 'custom') return;
  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;
  return [
    { group: 'Custom', result: [{ title: 'Custom result', link: '/guide' }] },
    { group: 'Cyclic', result: cyclic },
  ];
};
