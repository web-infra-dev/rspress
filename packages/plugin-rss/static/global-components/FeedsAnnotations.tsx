import type { PageFeedData } from '@rspress/plugin-rss';
import { Helmet, usePageData } from 'rspress/runtime';
import type { LinkHTMLAttributes } from 'react';

export default function FeedsAnnotations() {
  const { page } = usePageData();
  const feeds = (page.feeds as PageFeedData[]) || [];

  return (
    <Helmet>
      {feeds.map(({ language, url, mime }) => {
        const props: LinkHTMLAttributes<HTMLLinkElement> = {
          rel: 'alternate',
          type: mime,
          href: url,
        };
        if (language) {
          props.hrefLang = language;
        }
        // biome-ignore lint/correctness/useJsxKeyInIterable: no key props
        return <link {...props} />;
      })}
    </Helmet>
  );
}
