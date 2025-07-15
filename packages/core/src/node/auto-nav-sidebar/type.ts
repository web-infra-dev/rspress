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

// just copied from CustomLinkMeta, but without type field, to avoid circular reference in json schema
type _CustomLinkMetaWithoutTypeField =
  | {
      type?: 'custom-link';
      label?: string;
      tag?: string;
      overviewHeaders?: number[];
      context?: string;
      // custom link
      link: string;
    }
  | {
      type?: 'custom-link';
      label?: string;
      tag?: string;
      overviewHeaders?: number[];
      context?: string;
      link: string;
      collapsible?: boolean;
      collapsed?: boolean;
      items?: _CustomLinkMetaWithoutTypeField[];
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
      items?: _CustomLinkMetaWithoutTypeField[];
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
