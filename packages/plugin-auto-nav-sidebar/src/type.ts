import { Nav } from '@rspress/shared';

export type NavMeta = Nav;

export type SideMetaItem =
  | string
  | {
      type: 'file' | 'dir' | 'custom-link';
      name: string;
      link?: string;
      // Use the h1 title as the sidebar title by default
      label?: string;
      collapsible?: boolean;
      collapsed?: boolean;
      tag?: string;
    };

export type SideMeta = SideMetaItem[];
