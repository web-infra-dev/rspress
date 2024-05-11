import { DEFAULT_HIGHLIGHT_LANGUAGES } from '@rspress/shared';
import { uniqBy } from 'lodash-es';
import { FactoryContext, RuntimeModuleID } from '.';

function getLanguageMeta(highlightLanguages: (string | string[])[]) {
  const aliases: Record<string, string[]> = {};
  const languageMeta = uniqBy(
    [...DEFAULT_HIGHLIGHT_LANGUAGES, ...highlightLanguages].map(language => {
      const isArray = Array.isArray(language);
      const [alias, name] = isArray ? language : [language, language];

      if (isArray) {
        const temp = aliases[name] || (aliases[name] = []);

        if (!temp.includes(alias)) {
          temp.push(alias);
        }
      }

      return { alias, name };
    }),
    'name',
  );
  return { languageMeta, aliases };
}

export async function prismLanguageVMPlugin(context: FactoryContext) {
  const { config } = context;
  const { highlightLanguages = [] } = config.markdown || {};

  const { languageMeta, aliases } = getLanguageMeta(highlightLanguages);

  const importStatement = languageMeta.map(language => {
    const { alias, name } = language;
    return `import ${alias} from 'react-syntax-highlighter/dist/esm/languages/prism/${name}'`;
  });

  const moduleContent = `
${importStatement.join('\n')}

export const aliases = ${JSON.stringify(aliases)};

export default {
  ${languageMeta.map(({ alias, name }) => {
    return `"${name}": ${alias}`;
  })}
};
`;
  return {
    [RuntimeModuleID.PrismLanguages]: moduleContent,
  };
}
