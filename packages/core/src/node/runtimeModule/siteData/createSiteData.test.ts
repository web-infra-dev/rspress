import { describe, expect, it } from '@rstest/core';
import { createSiteData } from './createSiteData';

describe('createSiteData', () => {
  it('enables base redirects by default', async () => {
    const { siteData } = await createSiteData({});

    expect(siteData.route.baseRedirect).toBe(true);
  });

  it('allows base redirects to be disabled', async () => {
    const { siteData } = await createSiteData({
      route: {
        baseRedirect: false,
      },
    });

    expect(siteData.route.baseRedirect).toBe(false);
  });
});
