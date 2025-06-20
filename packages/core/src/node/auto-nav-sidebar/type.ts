import type { NavItem } from '@rspress/shared';

export type FileSideMeta = {
  type: 'file';
  name: string;
  label?: string;
  tag?: string;
  overviewHeaders?: number[];
  context?: string;
};

export type DirSideMeta = {
  type: 'dir';
  name: string;
  label?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  tag?: string;
  overviewHeaders?: number[];
  context?: string;
};

export type DividerSideMeta = {
  type: 'divider';
  dashed?: boolean;
};

export type SectionHeaderMeta = {
  type: 'section-header';
  label: string;
  tag?: string;
};

export type CustomLinkMeta = {
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
