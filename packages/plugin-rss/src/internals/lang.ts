export type PartialPartial<T, K extends keyof T> = Partial<Pick<T, K>> &
  Omit<T, K>;

export type ItemOf<T> = T extends Array<infer K> ? K : never;

export function notNullish<T>(n: T | undefined | null): n is T {
  return n !== undefined && n !== null;
}
export function concatArray<T>(...arrList: (T[] | T | undefined)[]) {
  return arrList.reduce<T[]>(
    (arr, item) =>
      arr.concat((Array.isArray(item) ? item : [item]).filter(notNullish)),
    [] as T[],
  );
}

export function selectNonNullishProperty(...list: unknown[]) {
  for (const item of list) {
    if (item === '') return '';
    if (item === 0) return '0';
    if (typeof item === 'number') return `${item}`;
    if (typeof item === 'string') return item;
  }
}

export function toDate(s: string | Date): null | Date {
  const d = new Date(s);
  return Number.isNaN(d.getDate()) ? null : d;
}

export function sortByDate(l: null | Date, r: null | Date): number {
  return (r ? r.getTime() : 0) - (l ? l.getTime() : 0);
}
