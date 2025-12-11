export interface Sidebar {
  [path: string]: (
    | SidebarGroup
    | SidebarItem
    | SidebarDivider
    | SidebarSectionHeader
  )[];
}

export interface SidebarGroup {
  text: string;
  link?: string;
  tag?: string;
  items: (SidebarGroup | SidebarItem | SidebarDivider | SidebarSectionHeader)[];
  collapsible?: boolean;
  collapsed?: boolean;
  /**
   * For hmr usage in development
   */
  _fileKey?: string;
  overviewHeaders?: number[];
  context?: string;
}

export type SidebarItem = {
  text: string;
  link: string;
  tag?: string;
  /**
   * For hmr usage in development
   */
  _fileKey?: string;
  overviewHeaders?: number[];
  context?: string;
};

export type SidebarDivider = { dividerType: 'dashed' | 'solid' };

export type SidebarSectionHeader = {
  sectionHeaderText: string;
  tag?: string;
};

// normalized config ---------------------------------------------------------
export type SidebarData = (
  | SidebarDivider
  | SidebarItem
  | SidebarSectionHeader
  | NormalizedSidebarGroup
)[];

export interface NormalizedSidebarGroup extends Omit<SidebarGroup, 'items'> {
  items: SidebarData;
  collapsible: boolean;
  collapsed: boolean;
}

export interface NormalizedSidebar {
  [path: string]: SidebarData;
}
