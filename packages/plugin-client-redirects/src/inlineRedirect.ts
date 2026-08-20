import type { RedirectsOptions } from './types';

const serializeInlineScriptData = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c');

// Resolve redirects before the first render to avoid showing the source page
// while waiting for React to hydrate.
export function getInlineRedirectScript(
  options: RedirectsOptions = {},
  basePath = '/',
): string {
  const { redirects } = options;

  if (!redirects?.length) {
    return '';
  }

  const base = basePath === '/' ? '' : basePath.replace(/\/$/, '');

  return `(function() {
    var redirects = ${serializeInlineScriptData(redirects)}, base = ${serializeInlineScriptData(base)}, redirectingKey = Symbol.for('rspress.redirecting');
    if (window[redirectingKey]) return;
    var pathname = window.location.pathname, hash = window.location.hash, hasBase = base && (pathname === base || pathname.startsWith(base + '/')), routePathname = hasBase ? pathname.slice(base.length) || '/' : pathname;
    redirectLoop: for (var i = 0; i < redirects.length; i++) {
      var redirect = redirects[i], patterns = Array.isArray(redirect.from) ? redirect.from : [redirect.from], to = redirect.to;
      for (var j = 0; j < patterns.length; j++) {
        var pattern = patterns[j];
        try {
          var regex = new RegExp(pattern);
          if (regex.test(routePathname)) {
            var isExternal = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(to) && !/^(?:javascript|data|file):/i.test(to);
            window[redirectingKey] = true;
            window.location.replace(isExternal ? to : (hasBase ? base : '') + routePathname.replace(regex, to) + hash);
            break redirectLoop;
          }
        } catch (error) {
          console.warn('Invalid redirect pattern: ' + pattern, error);
        }
      }
    }
  })()`.replace(/\n\s*/g, '');
}
