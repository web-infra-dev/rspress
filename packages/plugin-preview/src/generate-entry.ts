import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { staticPath, virtualDir } from './constant';
import type { CustomEntry, DemoInfo } from './types';
import { toValidVarName } from './utils';

export async function generateEntry(
  demos: DemoInfo,
  framework: 'react' | 'solid',
  position: 'follow' | 'fixed',
  customEntry?: (meta: CustomEntry) => string,
) {
  const sourceEntry: Record<string, string> = {};
  const entryCssPath = join(staticPath, 'global-styles', 'entry.css');

  await mkdir(virtualDir, { recursive: true });

  if (position === 'follow') {
    await Promise.all(
      Object.values(demos)
        .map(routes =>
          routes.map(async route => {
            const { id, path: demoPath } = route;
            const entry = join(virtualDir, `${id}.entry.tsx`);
            const solidEntry = `
        import { render } from 'solid-js/web';
        import ${JSON.stringify(entryCssPath)};
        import Demo from ${JSON.stringify(demoPath)};
        render(() => <Demo />, document.getElementById('root'));
        `;

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
                : solidEntry;
            await writeFile(entry, entryContent);
            sourceEntry[id] = entry;
          }),
        )
        .flat(),
    );
  } else {
    await Promise.all(
      Object.entries(demos).map(async ([key, routes]) => {
        if (routes.length === 0) {
          return;
        }
        const reactContent = `
        import { createRoot } from 'react-dom/client';
        import ${JSON.stringify(entryCssPath)};
        ${routes
          .map((demo, index) => {
            return `import Demo_${index} from ${JSON.stringify(demo.path)}`;
          })
          .join('\n')}
        function App() {
          return (
            <div className="preview-container">
              <div className="preview-nav">{"${routes[0].title}"}</div>
              ${routes
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
        const solidContent = `
        import { render } from 'solid-js/web';
        import ${JSON.stringify(entryCssPath)};
        ${routes
          .map((demo, index) => {
            return `import Demo_${index} from ${JSON.stringify(demo.path)}`;
          })
          .join('\n')}
        function App() {
          return (
            <div class="preview-container">
              <div class="preview-nav">{"${routes[0].title}"}</div>
              ${routes
                .map((_, index) => {
                  return `<Demo_${index} />`;
                })
                .join('\n')}
            </div>
          )
        }
        render(() => <App /> , document.getElementById('root'));
      `;
        const renderContent =
          framework === 'solid' ? solidContent : reactContent;
        const id = `_${toValidVarName(key)}`;
        const entry = join(virtualDir, `${id}.entry.tsx`);
        await writeFile(entry, renderContent);
        sourceEntry[id] = entry;
      }),
    );
  }
  return sourceEntry;
}
