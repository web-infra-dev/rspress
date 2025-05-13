import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { staticPath, virtualDir } from './constant';
import type { DemoInfo } from './types';
import { toValidVarName } from './utils';

function generateEntryForPerComponent(
  demos: DemoInfo,
  entryCssPath: string,
  framework: string,
): Record<string, string> {
  const sourceEntry: Record<string, string> = {};
  Object.values(demos).forEach(routes => {
    routes.forEach(route => {
      const { id, path: demoPath } = route;
      const entry = join(virtualDir, `${id}.entry.tsx`);
      const solidEntry = `
      import { render } from 'solid-js/web';
      import ${JSON.stringify(entryCssPath)};
      import Demo from ${JSON.stringify(demoPath)};
      render(() => <Demo />, document.getElementById('root'));
      `;

      const reactEntry = `
      import { render } from 'react-dom';
      import ${JSON.stringify(entryCssPath)};
      import Demo from ${JSON.stringify(demoPath)};
      render(<Demo />, document.getElementById('root'));
      `;
      const entryContent = framework === 'react' ? reactEntry : solidEntry;
      writeFileSync(entry, entryContent);
      sourceEntry[id] = entry;
    });
  });
  return sourceEntry;
}

function generateEntryForPage(
  demos: DemoInfo,
  entryCssPath: string,
  framework: string,
) {
  const sourceEntry: Record<string, string> = {};
  Object.entries(demos).forEach(([key, routes]) => {
    if (routes.length === 0) {
      return;
    }
    const reactContent = `
      import { render } from 'react-dom';
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
      render(<App /> , document.getElementById('root'));
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
    const renderContent = framework === 'solid' ? solidContent : reactContent;
    const id = `_${toValidVarName(key)}`;
    const entry = join(virtualDir, `${id}.entry.tsx`);
    writeFileSync(entry, renderContent);
    sourceEntry[id] = entry;
  });
  return sourceEntry;
}

// TODO: Support custom entry template files
export function generateEntry(
  demos: DemoInfo,
  framework: 'react' | 'solid',
  position: 'follow' | 'fixed' | 'fixed-with-per-comp',
): Record<string, string> {
  const sourceEntry: Record<string, string> = {};
  const entryCssPath = join(staticPath, 'global-styles', 'entry.css');
  if (position === 'follow') {
    const entries = generateEntryForPerComponent(
      demos,
      entryCssPath,
      framework,
    );
    Object.assign(sourceEntry, entries);
  } else if (position === 'fixed') {
    const entries = generateEntryForPage(demos, entryCssPath, framework);
    Object.assign(sourceEntry, entries);
  } else if (position === 'fixed-with-per-comp') {
    const entries = generateEntryForPerComponent(
      demos,
      entryCssPath,
      framework,
    );
    Object.assign(sourceEntry, entries);
    const perPageEntries = generateEntryForPage(demos, entryCssPath, framework);
    Object.assign(sourceEntry, perPageEntries);
  }
  return sourceEntry;
}
