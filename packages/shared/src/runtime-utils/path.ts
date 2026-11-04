/**
 * Path segment-boundary matching helpers.
 *
 * All matching here treats whole path segments as the unit, so `/guide`
 * never matches `/guidelines` — the same class of bug fixed for
 * `withBase`/`removeBase` in #3702. New path/URL prefix checks should
 * reuse these instead of raw `startsWith`.
 */

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
