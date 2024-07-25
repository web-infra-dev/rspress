import { usePageData } from '@rspress/runtime';

export function HomeFooter() {
  const { siteData } = usePageData();
  const { message } = siteData.themeConfig.footer || {};

  if (!message) {
    return null;
  }

  return (
    <footer className="absolute bottom-0 mt-12 py-8 px-6 sm:p-8 w-full border-t border-solid border-divider-light">
      <div className="m-auto w-full text-center">
        <div
          className="font-meduim text-sm text-text-2"
          dangerouslySetInnerHTML={{
            __html: message,
          }}
        />
      </div>
    </footer>
  );
}
