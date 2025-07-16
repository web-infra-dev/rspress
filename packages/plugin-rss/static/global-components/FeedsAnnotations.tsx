/// <reference path="../../index.d.ts" />

import { Head, usePageData } from '@rspress/core/runtime';
import type { LinkHTMLAttributes } from 'react';

export default function FeedsAnnotations() {
  const { page } = usePageData();
  const feeds = page.feeds || [];

  return (
    <Head>
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
    </Head>
  );
}
