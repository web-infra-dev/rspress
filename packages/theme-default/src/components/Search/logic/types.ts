import type { LocalSearchOptions, RemoteSearchOptions } from '@rspress/shared';

export const enum RenderType {
  Default = 'default',
  Custom = 'custom',
}

export interface HightlightInfo {
  start: number;
  length: number;
}

interface CommonMatchResult {
  title: string;
  header: string;
  link: string;
  query: string;
  highlightInfoList: HightlightInfo[];
  group: string;
}

interface TitleMatch extends CommonMatchResult {
  type: 'title';
}

interface HeaderMatch extends CommonMatchResult {
  type: 'header';
}

interface ContentMatch extends CommonMatchResult {
  type: 'content';
  statement: string;
}

export type DefaultMatchResultItem = TitleMatch | HeaderMatch | ContentMatch;

export type DefaultMatchResult = {
  group: string;
  renderType: RenderType;
  result: DefaultMatchResultItem[];
};

export type UserMatchResultItem<T = unknown> = {
  group: string;
  result: T;
};

export type CustomMatchResult = UserMatchResultItem & {
  renderType: RenderType.Custom;
};

export type MatchResult = (DefaultMatchResult | CustomMatchResult)[];

export type PageSearcherConfig = {
  currentLang: string;
  currentVersion: string;
  extractGroupName: (path: string) => string;
};

export type SearchOptions = (LocalSearchOptions | RemoteSearchOptions) &
  PageSearcherConfig;

export type BeforeSearch = (query: string) => string | Promise<string> | void;

export type OnSearch = (
  query: string,
  matchedResult: DefaultMatchResult[],
) =>
  | { group: string; result: unknown; renderType?: RenderType }[]
  | Promise<{ group: string; result: unknown; renderType?: RenderType }[]>
  | void;

export type AfterSearch = (
  query: string,
  matchedResult: MatchResult,
) => void | Promise<void>;

export type RenderSearchFunction<T = unknown> = (result: T) => JSX.Element;
