/**
 * Path segment-boundary matching helpers.
 *
 * All matching here treats whole path segments as the unit, so `/guide`
 * never matches `/guidelines` — the same class of bug fixed for
 * `withBase`/`removeBase` in #3702. New path/URL prefix checks should
 * reuse these instead of raw `startsWith`.
 */

import type { NavItem } from '../types';
import { logger } from '../logger';

const warnedActiveMatches = new Set<string>();

/**
 * Sidebar / grouping semantics: a `/` key matches every pathname,
 * because a root-level sidebar section contains all pages.
 */
export function isPathPrefix(pathname: string, prefix: string): boolean {
  if (prefix === '/' || prefix === '') {
    return true;
  }
  const normalizedPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  return (
    pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`)
  );
}

/**
 * Navbar active-state semantics: `/` only matches the homepage itself,
 * so a root link is not highlighted on every page.
 */
export function matchNavPath(pathname: string, link: string): boolean {
  const normalizedLink =
    link === '/' ? '/' : link.endsWith('/') ? link.slice(0, -1) : link;
  if (normalizedLink === '/') {
    return pathname === '/';
  }
  return (
    pathname === normalizedLink || pathname.startsWith(`${normalizedLink}/`)
  );
}

/**
 * Match a route path against a plain nav link: `.html` suffixes and
 * `/index` segments (added by link normalization) are stripped, then the
 * match is segment-bounded. Used to bucket pages into llms.txt sections.
 */
export function matchNavLink(link: string, routePath: string): boolean {
  let base = link.replace(/\.html?$/, '').replace(/\/index$/, '/');
  if (base !== '/' && base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  return isPathPrefix(routePath, base || '/');
}

/**
 * Match a route path against a nav item: `activeMatch` is treated as a
 * regex (invalid patterns never match instead of crashing the build),
 * plain links go through `matchNavLink`, and dropdown items match when
 * any of their children does.
 */
export function matchNavItem(navItem: NavItem, routePath: string): boolean {
  if ('activeMatch' in navItem && navItem.activeMatch) {
    try {
      return new RegExp(navItem.activeMatch).test(routePath);
    } catch {
      // Warn once per pattern so a config typo is not silently swallowed.
      if (!warnedActiveMatches.has(navItem.activeMatch)) {
        warnedActiveMatches.add(navItem.activeMatch);
        logger.warn(`Invalid activeMatch regex: ${navItem.activeMatch}`);
      }
      return false;
    }
  }
  if ('link' in navItem && navItem.link) {
    return matchNavLink(navItem.link, routePath);
  }
  if ('items' in navItem) {
    return navItem.items.some(child => matchNavItem(child, routePath));
  }
  return false;
}

/**
 * Strip a leading multi-version segment (e.g. `/v2`) from a pathname so
 * version-agnostic nav links — which carry no version prefix — match
 * pages of every version.
 */
export function stripRouteVersionPrefix(
  pathname: string,
  versions: string[],
): string {
  if (versions.length === 0) {
    return pathname;
  }
  const segments = pathname.split('/');
  const index = segments.findIndex(
    segment => segment && versions.includes(segment),
  );
  if (index === -1) {
    return pathname;
  }
  segments.splice(index, 1);
  const stripped = segments.join('/');
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}
