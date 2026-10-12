export const beforeSearch = (query: string) => {
  if (query === 'fail') throw new Error('Search hook failed');
  return query === 'alias' ? 'cobalt' : query;
};
