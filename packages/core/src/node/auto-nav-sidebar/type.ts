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
  tag?: string;
  overviewHeaders?: number[];
  context?: string;

  collapsible?: boolean;
  collapsed?: boolean;
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

export type CustomLinkMeta =
  | {
      // file link
      type: 'custom-link';
      label?: string;
      tag?: string;
      overviewHeaders?: number[];
      context?: string;
      // custom link
      link: string;
    }
  | {
      // dir link
      type: 'custom-link';
      label?: string;
      tag?: string;
      overviewHeaders?: number[];
      context?: string;
      // custom link
      link: string;
      // DirSideMeta
      collapsible?: boolean;
      collapsed?: boolean;
      items?: (Omit<CustomLinkMeta, 'type'> & { type?: 'custom-link' })[];
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
export type MetaJson = SideMeta;
export type NavJson = NavItem[];
