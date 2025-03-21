import { usePageData, withBase } from '@rspress/runtime';

export function NotFoundLayout() {
  const { siteData, page } = usePageData();
  const defaultLang = siteData.lang;
  const defaultVersion = siteData.multiVersion.default;
  // Consider the existing sites include the defaultLang in some links, such as '/zh/guide/quick-start'
  // We need to redirect them to '/guide/quick-start'
  // In the meanwhile, we will not show the 404 page for the user experience
  if (
    defaultLang &&
    typeof window !== 'undefined' &&
    location.pathname.includes(`/${defaultLang}/`)
  ) {
    const redirectUrl = location.pathname.replace(`/${defaultLang}/`, '/');
    window.location.replace(redirectUrl);
    return <></>;
  }

  let root = '/';
  if (defaultVersion && page.version !== defaultVersion) {
    root += `${page.version}/`;
  }
  if (defaultLang && page.lang !== defaultLang) {
    root += `${page.lang}/`;
  }

  // The 404 page content
  return (
    <div className="rp-m-auto rp-mt-50 rp-p-16 sm:rp-p-8 sm:rp-pt-24 sm:rp-pb-40 rp-text-center rp-flex-center rp-flex-col">
      <p className="rp-text-6xl rp-font-semibold">404</p>
      <h1 className="rp-leading-5 rp-pt-3 rp-text-xl rp-font-bold">
        PAGE NOT FOUND
      </h1>
      <div
        style={{ height: '1px' }}
        className="rp-mt-6 rp-mx-auto rp-mb-4.5 rp-w-16 rp-bg-gray-light-1"
      />

      <div className="rp-pt-5">
        <a
          className="rp-py-2 rp-px-4 rp-rounded-2xl rp-inline-block rp-border-solid rp-border-brand rp-text-brand rp-font-medium hover:rp-border-brand-dark hover:rp-text-brand-dark rp-transition-colors rp-duration-300"
          href={withBase(root)}
          aria-label="go to home"
        >
          Take me home
        </a>
      </div>
    </div>
  );
}
