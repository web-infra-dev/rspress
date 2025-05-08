import type { NavItem } from '@rspress/shared';

type FileSideMeta = {
  type: 'file';
  name: string;
  label?: string;
  tag?: string;
  overviewHeaders?: number[];
  context?: string;
};

type DirSideMeta = {
  type: 'dir';
  name: string;
  label?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  tag?: string;
  overviewHeaders?: number[];
  context?: string;
};

type DividerSideMeta = {
  type: 'divider';
  dashed?: boolean;
};

type SectionHeaderMeta = {
  type: 'section-header';
  label: string;
  tag?: string;
};

type CustomLinkMeta = {
  type: 'custom-link';
  label: string;
  link: string;
  context?: string;
  tag?: string;
};

export type SideMetaItem =
  | FileSideMeta
  | DirSideMeta
  | DividerSideMeta
  | SectionHeaderMeta
  | CustomLinkMeta
  | string;

export type SideMeta = SideMetaItem[];

// this type is used to generate schema
export type MetaJson = SideMetaItem[] | NavItem[];
