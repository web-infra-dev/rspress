import { NavItem } from '@rspress/shared';

export type NavMeta = NavItem[];

export type SideMetaItem =
  | string
  | {
      type: 'file' | 'dir' | 'divider' | 'custom-link';
      name: string;
      link?: string;
      // Use the h1 title as the sidebar title by default
      label?: string;
      collapsible?: boolean;
      collapsed?: boolean;
      tag?: string;
      dashed?: boolean;
    };

export type SideMeta = SideMetaItem[];
