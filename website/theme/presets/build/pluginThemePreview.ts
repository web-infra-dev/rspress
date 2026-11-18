import path from 'node:path';
import type { UserConfig } from '@rspress/core';
import ts from 'typescript';

type RsbuildPlugin = NonNullable<
  NonNullable<UserConfig['builderConfig']>['plugins']
>[number];

interface PreviewSource {
  id: string;
  directory: string;
}

/**
 * Website-only adaptation of ordinary source themes. Normal imports (without
 * ?theme-preview) remain untouched, including when this folder is copied out.
 * Shared Rspress styles are never rewritten; only a registered theme's local
 * CSS/SCSS side-effect imports are collected as compiled strings.
 */
export function pluginThemePreview(
  sources: readonly PreviewSource[],
): RsbuildPlugin {
  const styleRegistry = path.resolve(
    import.meta.dirname,
    '../previewStyles.ts',
  );
  return {
    name: 'website:theme-preview',
    setup(api) {
      api.transform(
        {
          test: /\.[cm]?[jt]sx?$/,
          resourceQuery: /[?&]theme-preview(?:&|$)/,
          order: 'pre',
        },
        ({ code, resourcePath }: { code: string; resourcePath: string }) => {
          const source = sources.find(({ directory }) => {
            const relative = path.relative(directory, resourcePath);
            return (
              relative &&
              !relative.startsWith('..') &&
              !path.isAbsolute(relative)
            );
          });
          if (!source)
            throw new Error(
              `Preview source is outside a registered theme: ${resourcePath}`,
            );
          const file = ts.createSourceFile(
            resourcePath,
            code,
            ts.ScriptTarget.Latest,
            true,
          );
          const edits: { start: number; end: number; text: string }[] = [];
          let index = 0;
          for (const statement of file.statements) {
            if (
              !ts.isImportDeclaration(statement) &&
              !ts.isExportDeclaration(statement)
            )
              continue;
            const specifier = statement.moduleSpecifier;
            if (!specifier || !ts.isStringLiteral(specifier)) continue;
            const request = specifier.text;
            if (!request.startsWith('.')) continue;
            if (/\.(css|scss|sass)$/.test(request)) {
              if (
                !ts.isImportDeclaration(statement) ||
                statement.importClause
              ) {
                throw new Error(
                  'Theme preview currently supports side-effect CSS/SCSS imports, not CSS Modules.',
                );
              }
              const variable = `__previewCss${index++}`;
              edits.push({
                start: statement.getStart(file),
                end: statement.end,
                text:
                  `import ${variable} from ${JSON.stringify(`${request}?inline`)};\n` +
                  `__registerPreviewStyle(${JSON.stringify(source.id)}, ${JSON.stringify(path.resolve(path.dirname(resourcePath), request))}, ${variable});`,
              });
            } else if (
              !/\.(svg|png|jpe?g|webp|gif|woff2?|ttf|json)(?:\?|$)/.test(
                request,
              )
            ) {
              // Relative JS/TS imports and reexports retain the same module graph,
              // while the query propagates style collection to local components.
              edits.push({
                start: specifier.getStart(file),
                end: specifier.end,
                text: JSON.stringify(
                  `${request}${request.includes('?') ? '&' : '?'}theme-preview`,
                ),
              });
            }
          }
          let transformed = code;
          for (const edit of edits.sort((a, b) => b.start - a.start)) {
            transformed =
              transformed.slice(0, edit.start) +
              edit.text +
              transformed.slice(edit.end);
          }
          if (index)
            transformed = `import { registerPreviewStyle as __registerPreviewStyle } from ${JSON.stringify(styleRegistry)};\n${transformed}`;
          return transformed;
        },
      );
    },
  };
}
