import { join } from 'node:path';
import { VIRTUAL_DEMO_DIR } from './constants';
import type { CustomEntry, DemoInfo } from './types';
import { toValidVarName } from './utils';

function reactEntry({ demoPath }: CustomEntry) {
  return `
    import { createRoot } from 'react-dom/client';
    import Demo from ${JSON.stringify(demoPath)};
    const container = document.getElementById('root');
    createRoot(container).render(<Demo />);
    `;
}

export function generateEntry(
  demos: DemoInfo,
  framework: 'react' | 'solid',
  customEntry?: (meta: CustomEntry) => string,
): {
  sourceEntry: Record<string, string>;
  virtualFiles: Record<string, string>;
} {
  const sourceEntry: Record<string, string> = {};
  const virtualFiles: Record<string, string> = {};

  const generateEntryContent = (meta: CustomEntry) => {
    return customEntry
      ? customEntry(meta)
      : framework === 'react'
        ? reactEntry(meta)
        : '';
  };

  for (const [pageName, pageDemos] of Object.entries(demos)) {
    // 'iframe-follow'
    const followDemos = pageDemos.filter(
      demo => demo.previewMode === 'iframe-follow',
    );

    for (const demo of followDemos) {
      const { id, path: demoPath } = demo;
      const entry = join(VIRTUAL_DEMO_DIR, `${id}.entry.tsx`);
      virtualFiles[entry] = generateEntryContent({ demoPath });
      sourceEntry[id] = entry;
    }

    // 'iframe-fixed'
    const fixedDemos = pageDemos.filter(
      demo => demo.previewMode === 'iframe-fixed',
    );

    if (fixedDemos.length > 0) {
      const appContent = `
        ${fixedDemos
          .map((demo, index) => {
            return `import Demo_${index} from ${JSON.stringify(demo.path)}`;
          })
          .join('\n')}
        function App() {
          return (
            <div className="rp-preview-container">
              <div className="rp-preview-nav">{"${fixedDemos[0].title}"}</div>
              ${fixedDemos
                .map((_demo, index) => {
                  return `<Demo_${index} />`;
                })
                .join('\n')}
            </div>
          )
        }
        export default App;
      `;

      const id = `_${toValidVarName(pageName)}`;
      const demoPath = join(VIRTUAL_DEMO_DIR, `${id}.app.tsx`);
      const entry = join(VIRTUAL_DEMO_DIR, `${id}.entry.tsx`);

      virtualFiles[demoPath] = appContent;
      virtualFiles[entry] = generateEntryContent({ demoPath });
      sourceEntry[id] = entry;
    }
  }

  return { sourceEntry, virtualFiles };
}
