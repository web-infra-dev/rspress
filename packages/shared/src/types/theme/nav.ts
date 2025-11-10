// nav -----------------------------------------------------------------------
// TODO: split version nav to a single file
export type Nav = NavItem[] | { [key: string]: NavItem[] };

export type NavItem =
  | NavItemWithLink
  | NavItemWithChildren
  | NavItemWithLinkAndChildren;

export type NavItemWithLink = {
  text: string;
  link: string;
  tag?: string;
  activeMatch?: string;
  position?: 'left' | 'right';
};

export interface NavItemWithChildren {
  text?: string;
  tag?: string;
  items: NavItemWithLink[];
  position?: 'left' | 'right';
}

export interface NavItemWithLinkAndChildren {
  text: string;
  link: string;
  items: NavItemWithLink[];
  tag?: string;
  activeMatch?: string;
  position?: 'left' | 'right';
}
