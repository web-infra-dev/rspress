import { uniqBy } from 'lodash-es';
import { DEFAULT_HIGHLIGHT_LANGUAGES } from '@rspress/shared';
import { FactoryContext, RuntimeModuleID } from '.';

export async function prismLanguageVMPlugin(context: FactoryContext) {
  const { config } = context;
  const { highlightLanguages = [] } = config.markdown || {};
  const languageMeta = uniqBy(
    [...DEFAULT_HIGHLIGHT_LANGUAGES, ...highlightLanguages].map(language => {
      const [alias, name] = Array.isArray(language)
        ? language
        : [language, language];
      return { alias, name };
    }),
    'alias',
  );

  const importStatement = languageMeta.map(language => {
    const { alias, name } = language;
    return `import ${alias} from 'react-syntax-highlighter/dist/esm/languages/prism/${name}'`;
  });

  const moduleContent = `
${importStatement.join('\n')}

export default {
  ${languageMeta.map(({ alias }) => `"${alias}": ${alias}`)}
};
`;
  return {
    [RuntimeModuleID.PrismLanguages]: moduleContent,
  };
}
