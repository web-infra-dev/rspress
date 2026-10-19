type ChangeFreq =
  'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

type Priority =
  | '0.0'
  | '0.1'
  | '0.2'
  | '0.3'
  | '0.4'
  | '0.5'
  | '0.6'
  | '0.7'
  | '0.8'
  | '0.9'
  | '1.0';

// https://www.sitemaps.org/protocol.html
interface Sitemap {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: Priority;
}

interface CustomMaps {
  [routePath: string]: Sitemap;
}

export interface SitemapOptions {
  siteUrl?: string;
  customMaps?: CustomMaps;
  defaultPriority?: Priority;
  defaultChangeFreq?: ChangeFreq;
}
