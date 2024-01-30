import { join } from 'path';
import { writeFileSync } from 'fs';
import { virtualDir, staticPath } from './constant';
import type { DemoInfo } from './types';

// TODO: Support custom entry template files
export function generateEntry(
  demos: DemoInfo,
  framework: 'react' | 'solid',
  position: 'follow' | 'fixed',
) {
  const sourceEntry: Record<string, string> = {};
  const entryCssPath = join(staticPath, 'global-styles', 'entry.css');
  if (position === 'follow') {
    Object.values(demos).forEach(routes => {
      routes.forEach(route => {
        const { id, path: demoPath } = route;
        const entry = join(virtualDir, `${id}.entry.tsx`);
        const solidEntry = `
        import { render } from 'solid-js/web';
        import '${entryCssPath}';
        import Demo from '${demoPath}';
        render(<Demo />, document.getElementById('root'));
        `;

        const reactEntry = `
        import React from 'react';
        import { render } from 'react-dom';
        import '${entryCssPath}';
        import Demo from '${demoPath}';
        render(<Demo />, document.getElementById('root'));
        `;
        const entryContent = framework === 'react' ? reactEntry : solidEntry;
        writeFileSync(entry, entryContent);
        sourceEntry[id] = entry;
      });
    });
  } else {
    Object.entries(demos).forEach(([key, demos]) => {
      const reactContent = `
        import React from 'react';
        import { render } from 'react-dom';
        import '${entryCssPath}';
        ${demos
          .map((demo, index) => {
            return `import Demo_${index} from '${demo.path}'`;
          })
          .join('\n')}
        function App() {
          return (
            <div className="preview-container">
              <div className="preview-nav">{"${demos[0].title}"}</div>
              ${demos
                .map((demo, index) => {
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
        import '${entryCssPath}';
        ${demos
          .map((demo, index) => {
            return `import Demo_${index} from '${demo.path}'`;
          })
          .join('\n')}
        function App() {
          return (
            <div class="preview-container">
              <div class="preview-nav">{"${demos[0].title}"}</div>
              ${demos
                .map((demo, index) => {
                  return `<Demo_${index} />`;
                })
                .join('\n')}
            </div>
          )
        }
        render(<App /> , document.getElementById('root'));
      `;
      const renderContent = framework === 'solid' ? solidContent : reactContent;
      const entry = join(virtualDir, `${key}.entry.tsx`);
      writeFileSync(entry, renderContent);
      sourceEntry[`_${key}`] = entry;
    });
  }
  return sourceEntry;
}
