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
          // @ts-expect-error FIXME: why not hrefLang? @unhead/react issue
          props.hreflang = language;
        }
        return <link {...props} key={`${language}-${url}-${mime}`} />;
      })}
    </Head>
  );
}
