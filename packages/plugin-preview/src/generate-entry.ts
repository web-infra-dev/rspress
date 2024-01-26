import { join } from 'path';
import fs from 'fs';
import { virtualDir } from './constant';

// TODO: Support custom entry template files
export function generateEntry(
  demoRoutes: {
    id: string;
    path: string;
    group: string;
  }[],
  framework: 'react' | 'solid',
  position: 'follow' | 'fixed',
) {
  const sourceEntry: Record<string, string> = {};
  if (position === 'follow') {
    demoRoutes.forEach(route => {
      const { id, path: demoPath } = route;
      const entry = join(virtualDir, `${id}.entry.tsx`);
      const solidEntry = `
      import { render } from 'solid-js/web';
      import Demo from '${demoPath}';
      render(() => <Demo /> , document.getElementById('root'));
      `;

      const reactEntry = `
      import React from 'react';
      import { render } from 'react-dom';
      import Demo from '${demoPath}';
      render(<Demo /> , document.getElementById('root'));
      `;
      const entryContent = framework === 'react' ? reactEntry : solidEntry;
      fs.writeFileSync(entry, entryContent);
      sourceEntry[id] = entry;
    });
  } else {
    const groupedObj: Record<string, typeof demoRoutes> = {};

    for (const obj of demoRoutes) {
      const groupValue = obj.group;

      if (!groupedObj[groupValue]) {
        groupedObj[groupValue] = [];
      }

      groupedObj[groupValue].push(obj);
    }

    Object.entries(groupedObj).forEach(([key, demos]) => {
      // TODO: add solid template
      const renderContent = `
        import React from 'react';
        import { render } from 'react-dom';
        ${demos
          .map((demo, index) => {
            return `import Demo_${index} from '${demo.path}'`;
          })
          .join('\n')}
        function App() {
          return (
            <div className="preview-container">
              <div className="preview-nav">{"${key}"}</div>
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
      const entry = join(virtualDir, `${key}.entry.tsx`);
      fs.writeFileSync(entry, renderContent);
      sourceEntry[`_${key}`] = entry;
    });
  }
  console.log(sourceEntry);
  return sourceEntry;
}
