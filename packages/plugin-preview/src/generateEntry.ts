import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { STATIC_DIR, VIRTUAL_DEMO_DIR } from './constants';
import type { CustomEntry, DemoInfo } from './types';
import { toValidVarName } from './utils';

export async function generateEntry(
  globalDemos: DemoInfo,
  framework: 'react' | 'solid',
  customEntry?: (meta: CustomEntry) => string,
) {
  const sourceEntry: Record<string, string> = {};
  const entryCssPath = join(STATIC_DIR, 'global-styles', 'entry.css');

  await mkdir(VIRTUAL_DEMO_DIR, { recursive: true });

  await Promise.all(
    Object.entries(globalDemos)
      .map(([pageName, demos]) => {
        // 'iframe-follow'
        const followDemos = demos.filter(
          demo => demo.previewMode === 'iframe-follow',
        );

        const followPromiseList = followDemos.map(async demo => {
          const { id, path: demoPath } = demo;
          const entry = join(VIRTUAL_DEMO_DIR, `${id}.entry.tsx`);
          const reactEntry = `
            import { createRoot } from 'react-dom/client';
            import ${JSON.stringify(entryCssPath)};
            import Demo from ${JSON.stringify(demoPath)};
            const container = document.getElementById('root');
            createRoot(container).render(<Demo />);
            `;
          const entryContent = customEntry
            ? customEntry({
                entryCssPath,
                demoPath,
              })
            : framework === 'react'
              ? reactEntry
              : '';
          await writeFile(entry, entryContent);
          sourceEntry[id] = entry;
        });

        // 'iframe-fixed'
        const fixedDemos = demos.filter(
          demo => demo.previewMode === 'iframe-fixed',
        );

        const fixedPromise = (async () => {
          if (fixedDemos.length === 0) {
            return;
          }
          const reactContent = `
        import { createRoot } from 'react-dom/client';
        import ${JSON.stringify(entryCssPath)};
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
        const container = document.getElementById('root');
        createRoot(container).render(<App />);
      `;

          const renderContent = reactContent;
          const id = `_${toValidVarName(pageName)}`;
          const entry = join(VIRTUAL_DEMO_DIR, `${id}.entry.tsx`);
          await writeFile(entry, renderContent);
          sourceEntry[id] = entry;
        })();

        return [...followPromiseList, fixedPromise];
      })
      .flat(),
  );

  if (Object.keys(sourceEntry).length === 0) {
    return {
      // to ignore rsbuild no entry warning
      _index: 'data:text/javascript,console.log("no demo found");',
    };
  }

  return sourceEntry;
}
