import { uniqBy } from 'lodash-es';
import { DEFAULT_HIGHLIGHT_LANGUAGES } from '@rspress/shared';
import { FactoryContext, RuntimeModuleID } from '.';

export async function prismLanguageVMPlugin(context: FactoryContext) {
  const { config } = context;
  const { highlightLanguages = [] } = config.markdown || {};
  const aliases: Record<string, string[]> = {};
  const languageMeta = uniqBy(
    [...DEFAULT_HIGHLIGHT_LANGUAGES, ...highlightLanguages].map(language => {
      const isArray = Array.isArray(language);
      const [alias, name] = isArray ? language : [language, language];

      if (isArray) {
        const temp = aliases[name] || (aliases[name] = []);
        temp.push(alias);
      }

      return { alias, name };
    }),
    'name',
  );

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
