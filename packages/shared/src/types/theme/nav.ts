// nav -----------------------------------------------------------------------
// TODO: split version nav to a single file
export type Nav = NavItem[] | { [key: string]: NavItem[] };

export type NavItem =
  NavItemWithLink | NavItemWithChildren | NavItemWithLinkAndChildren;

export type NavItemWithLink = {
  text: string;
  link: string;
  download?: boolean;
  icon?: string;
  tag?: string;
  activeMatch?: string;
  position?: 'left' | 'right';
  lang?: string;
  rel?: string;
};

export interface NavItemWithChildren {
  text?: string;
  icon?: string;
  tag?: string;
  items: NavItem[];
  position?: 'left' | 'right';
}

export interface NavItemWithLinkAndChildren {
  text: string;
  link: string;
  items: NavItem[];
  icon?: string;
  tag?: string;
  activeMatch?: string;
  position?: 'left' | 'right';
  lang?: string;
  rel?: string;
}
