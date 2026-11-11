import path from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { RouteService } from './RouteService';

const SPECIAL_DIR = path.join(__dirname, 'fixtures', 'special-chars');

// This suite lives in its own file on purpose: RouteService is a
// singleton, and adding a second instance to RouteService.test.ts
// perturbs its scan-order-sensitive i18n snapshot.
describe('RouteService with special characters in filenames', () => {
  it('generates parseable route code and tolerates raw % in links', async () => {
    const routeService = await RouteService.create({
      config: {} as UserConfig,
      scanDir: SPECIAL_DIR,
      externalPages: [],
    });
    const routeCode = routeService.generateRoutesCode();

    // regression: a filename like `what's-new.mdx` was interpolated into
    // single-quoted strings, producing a virtual module that failed to
    // parse and crashed the whole build.
    const body = routeCode
      .replace(/^import .*$/gm, '')
      .replace('export const routes', 'const routes');
    expect(() => new Function(body)).not.toThrow();

    // regression: an internal link containing a raw `%` threw URIError
    // while resolving the link to a route.
    expect(() => routeService.isExistRoute('/100%-coverage')).not.toThrow();
    expect(routeService.isExistRoute('/100%-coverage')).toBe(true);
  });
});
