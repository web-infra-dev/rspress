import { createRequire } from 'node:module';
import { DEFAULT_HIGHLIGHT_LANGUAGES } from '@rspress/shared';
import picocolors from 'picocolors';

const require = createRequire(import.meta.url);
let supportedLanguages: Set<string>;

export function handleHighlightLanguages(
  highlightLanguages: Set<string>,
  defaultLanguages: (string | [string, string])[],
): Record<string, string[]> {
  // Automatically import prism languages
  const aliases: Record<string, string[]> = {};
  if (highlightLanguages.size) {
    if (!supportedLanguages) {
      const langs =
        require('react-syntax-highlighter/dist/cjs/languages/prism/supported-languages').default;
      supportedLanguages = new Set(langs);
    }

    // Restore alias to the original name
    let useDeprecatedTypeWarning = true;
    const names: Record<string, string> = {};
    [...DEFAULT_HIGHLIGHT_LANGUAGES, ...defaultLanguages].forEach(lang => {
      if (Array.isArray(lang)) {
        const [alias, name] = lang;
        names[alias] = name;
      } else if (useDeprecatedTypeWarning) {
        // Deprecated warning
        console.log(
          `${picocolors.yellowBright(
            'warning',
          )} Automatic import is supported. \`highlightLanguages\` is now used only as alias, and string types will be ignored. \n`,
        );
        useDeprecatedTypeWarning = false;
      }
    });

    [...highlightLanguages.values()].forEach(lang => {
      const name = names[lang];
      if (name && supportedLanguages.has(name)) {
        const temp = aliases[name] || (aliases[name] = []);
        if (!temp.includes(lang)) {
          temp.push(lang);
        }

        // delete first, user may config alias to itself like ['go', 'go']
        highlightLanguages.delete(lang);
        highlightLanguages.add(name);
        return;
      }

      if (!supportedLanguages.has(lang)) {
        highlightLanguages.delete(lang);
      }
    });
  }

  return aliases;
}
