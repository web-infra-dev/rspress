export function resolveUrl(base: string, relative: string): string {
  if (URL.canParse(base)) {
    return new URL(relative, base).href;
  }

  // RSS also supports paths without a site origin. Use a temporary origin
  // for URL resolution, then preserve the original kind of relative URL.
  const pathRelative = !base.startsWith('/') && !relative.startsWith('/');
  // Leave room for parent segments so path-relative URLs are not clamped
  // at the temporary origin's root.
  const depth = pathRelative
    ? base.split(/[\\/]/).length + relative.split(/[\\/]/).length
    : 0;
  let segment = '_';
  while (base.includes(segment) || relative.includes(segment)) {
    segment += '_';
  }
  const root = `/${`${segment}/`.repeat(depth)}`;
  const url = new URL(
    relative,
    new URL(base, `https://rspress.invalid${root}`),
  );

  if (URL.canParse(relative)) {
    return url.href;
  }
  if (base.startsWith('//') || relative.startsWith('//')) {
    return url.href.slice(url.protocol.length);
  }

  let pathname = url.pathname;
  if (pathRelative) {
    const segments = pathname.slice(1).split('/');
    let common = 0;
    while (common < depth && segments[common] === segment) {
      common++;
    }
    pathname = '../'.repeat(depth - common) + segments.slice(common).join('/');
  }
  return `${pathname}${url.search}${url.hash}`;
}
