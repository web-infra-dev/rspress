import type { PageFeedData } from '@rspress/plugin-rss';
import { Helmet, usePageData } from 'rspress/runtime';
import { LinkHTMLAttributes } from 'react';

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
        return <link {...props} />;
      })}
    </Helmet>
  );
}
