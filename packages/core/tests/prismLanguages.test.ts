import { describe, expect, it } from 'vitest';
import { prismLanguageVMPlugin } from '../src/node/runtimeModule/prismLanguages';

describe('getHighlightLanguages', () => {
  it('prismLanguageVMPlugin should be configurable to users', async () => {
    const meta = await prismLanguageVMPlugin({
      config: {
        markdown: {
          highlightLanguages: [
            // 1. add lang
            'zig',
            // 2. add alias
            ['MD', 'markdown'],
            // 3. add lang and alias
            ['oc', 'objectivec'],
          ],
        },
      },
      ...({} as any),
    });
    expect(meta).toMatchSnapshot();
  });
});
