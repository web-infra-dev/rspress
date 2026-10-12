import type {
  BaseRuntimePageInfo,
  NavItem,
  SidebarData,
} from '@rspress/shared';

export type PageInfo = Pick<
  BaseRuntimePageInfo,
  | 'title'
  | 'description'
  | 'routePath'
  | 'lang'
  | 'version'
  | 'toc'
  | 'frontmatter'
>;

export interface SiteInfo {
  title: string;
  description: string;
  base: string;
  siteOrigin: string;
  lang: string;
  version: string;
  locales: { lang: string; label: string }[];
  versions: string[];
  defaultVersion: string;
  nav: NavItem[];
  sidebar: SidebarData;
}

export interface NavigationResult {
  routePath: string;
  page: Pick<PageInfo, 'title' | 'description' | 'lang' | 'version'>;
  sections: { title: string; depth: number; routePath: string }[];
  previousPage: { title: string; routePath: string } | null;
  nextPage: { title: string; routePath: string } | null;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute(
    input: unknown,
    options?: { signal?: AbortSignal },
  ): unknown | Promise<unknown>;
}

export interface ModelContext {
  registerTool(
    tool: Tool,
    options: { signal: AbortSignal; exposedTo?: string[] },
  ): Promise<void>;
}

export interface ToolContext {
  site: SiteInfo;
  page: PageInfo;
  pages: PageInfo[];
  resolveRoute(pathname: string): string | undefined;
  origin: string;
  markdownUrl(routePath: string): string;
  markdown: boolean;
  fetch: typeof fetch;
  search?: (query: string, limit: number) => Promise<unknown>;
  navigate: (target: string, signal?: AbortSignal) => Promise<NavigationResult>;
}
