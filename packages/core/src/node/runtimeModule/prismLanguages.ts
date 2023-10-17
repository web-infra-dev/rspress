import { uniqBy } from 'lodash-es';
import { FactoryContext, RuntimeModuleID } from '.';

const DEFAULT_LANGUAGES = [
  ['js', 'javascript'],
  ['ts', 'typescript'],
  'tsx',
  'json',
  'css',
  'scss',
  'less',
  ['xml', 'xml-doc'],
  'yaml',
  ['md', 'markdown'],
];

export async function prismLanguageVMPlugin(context: FactoryContext) {
  const { config } = context;
  const { highlightLanguages = [] } = config.markdown || {};
  const languageMeta = uniqBy(
    [...DEFAULT_LANGUAGES, ...highlightLanguages].map(language => {
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
