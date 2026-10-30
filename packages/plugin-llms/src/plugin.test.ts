import { describe, expect, it } from '@rstest/core';
import { resolveNavForVersion } from './resolveNav';

describe('resolveNavForVersion', () => {
  it('keeps dropdown nav groups so their pages land in a real section', () => {
    // regression: the filter dropped items without `link`, so every page
    // of a dropdown section fell into the hardcoded "Other" block of
    // llms.txt and the child links were never considered for matching.
    const navList = resolveNavForVersion(
      [
        {
          lang: 'en',
          nav: [
            {
              text: 'Docs',
              items: [
                { text: 'Guide', link: '/guide' },
                { text: 'API', link: '/api' },
              ],
            },
            { text: 'Blog', link: '/blog' },
          ],
        },
      ],
      '',
      '',
    );

    expect(navList).toHaveLength(2);
    expect(navList[0]).toMatchObject({ text: 'Docs', lang: 'en' });
    expect(navList[1]).toMatchObject({ text: 'Blog', link: '/blog' });
  });
});
