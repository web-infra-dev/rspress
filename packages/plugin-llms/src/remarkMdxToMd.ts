import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { compile } from '@mdx-js/mdx';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

type RemarkMdxToMdModule = {
  name: string;
  mdx: string;
  compiled?: string;
  runtime?: unknown;
  error?: unknown;
};

type RemarkMdxToMdOptions = {
  /** Callback receiving each virtual module and providing rendered placeholder content. */
  onVirtualFile?: (payload: RemarkMdxToMdModule) => Promise<string>;
  /** Persist the virtual modules on the vfile via `file.data.mdxVirtualModules`. */
  emitToVFile?: boolean;
};

const DEFAULT_OPTIONS: RemarkMdxToMdOptions = {
  emitToVFile: true,
};

const remarkMdxToMd: Plugin<[RemarkMdxToMdOptions?], Root> =
  (options = {}) =>
  async (tree, file) => {
    const { onVirtualFile, emitToVFile } = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    const originalSource =
      typeof file.value === 'string' ? (file.value as string) : '';
    const importSnippets: string[] = [];
    type PlaceholderNode = { type: 'html'; value: string };
    const jsxSnippets: {
      name: string;
      source: string;
      placeholder: PlaceholderNode;
    }[] = [];

    const collectSource = (node: {
      value?: string;
      position?: {
        start?: { offset?: number };
        end?: { offset?: number };
      };
    }): string | null => {
      if (typeof node.value === 'string' && node.value.trim() !== '') {
        return node.value;
      }

      const start = node.position?.start?.offset;
      const end = node.position?.end?.offset;

      if (
        typeof start === 'number' &&
        typeof end === 'number' &&
        start >= 0 &&
        end >= start &&
        originalSource
      ) {
        return originalSource.slice(start, end);
      }

      return null;
    };

    const removeNode = (
      parent: { children?: unknown[] } | null | undefined,
      index: number | null | undefined,
      replacement?: unknown[],
    ) => {
      if (
        !parent ||
        typeof index !== 'number' ||
        !Array.isArray(parent.children)
      ) {
        return;
      }

      if (replacement?.length) {
        parent.children.splice(index, 1, ...replacement);
      } else {
        parent.children.splice(index, 1);
      }
    };

    visit(tree, 'mdxjsEsm', (node: any, index?: number, parent?: any) => {
      const source = collectSource(node);
      if (source) {
        importSnippets.push(source.trimEnd());
      }

      if (parent && typeof index === 'number') {
        removeNode(parent, index);
      } else {
        node.value = '';
      }

      return SKIP;
    });

    const handleJsx = (type: 'mdxJsxFlowElement' | 'mdxJsxTextElement') => {
      visit(tree, type, (node: any, index?: number, parent?: any) => {
        if (!parent || typeof index !== 'number') {
          return SKIP;
        }

        let compName = 'Component';
        if (node && typeof node === 'object') {
          if (typeof node.name === 'string') compName = node.name;
          else if (node?.tagName && typeof node.tagName === 'string')
            compName = node.tagName;
          else if (node?.name && typeof node.name === 'object')
            compName = node.name.name ?? node.name.value ?? compName;
        }

        const placeholder: PlaceholderNode = {
          type: 'html',
          value: `<!-- ${compName} -->`,
        };

        const source = collectSource(node);
        if (source) {
          jsxSnippets.push({
            name: compName,
            source: source.trimEnd(),
            placeholder,
          });
        }

        if (Array.isArray(parent.children)) {
          parent.children.splice(index, 1, placeholder);
        }

        return SKIP;
      });
    };

    handleJsx('mdxJsxFlowElement');
    handleJsx('mdxJsxTextElement');

    if (!jsxSnippets.length) {
      if (emitToVFile) {
        // eslint-disable-next-line no-param-reassign
        (file.data ??= {}).mdxVirtualModules = [];
      }
      return;
    }

    const uniqueImports: string[] = [];
    const seenImports = new Set<string>();
    importSnippets.forEach(snippet => {
      if (!seenImports.has(snippet)) {
        seenImports.add(snippet);
        uniqueImports.push(snippet);
      }
    });

    const importBlock = uniqueImports.join('\n');
    const results: RemarkMdxToMdModule[] = [];

    for (const { name, source, placeholder } of jsxSnippets) {
      const parts: string[] = [];
      if (importBlock) {
        parts.push(importBlock);
      }
      parts.push(source);
      const mdxCode = `${parts.join('\n\n')}\n`;

      const moduleResult: RemarkMdxToMdModule = { name, mdx: mdxCode };

      try {
        const compiled = await compile(mdxCode, { outputFormat: 'program' });
        const compiledCode = String(compiled);
        moduleResult.compiled = compiledCode;

        const baseDir = file.path ? path.dirname(file.path) : os.tmpdir();
        const tempFile = path.join(
          baseDir,
          `.rspress-mdx-${crypto.randomUUID() ?? Date.now().toString(36)}.mjs`,
        );

        try {
          await fs.writeFile(tempFile, compiledCode, 'utf-8');
          const module = await import(pathToFileURL(tempFile).href);
          const exported = module?.default ?? module;

          if (typeof exported === 'function') {
            moduleResult.runtime = await Promise.resolve(exported());
          } else {
            moduleResult.runtime = exported;
          }
        } catch (runtimeError) {
          moduleResult.runtime = {
            error:
              runtimeError instanceof Error
                ? runtimeError.message
                : String(runtimeError),
          };
        } finally {
          await fs.rm(tempFile, { force: true }).catch(() => {});
        }
      } catch (error) {
        moduleResult.error = error;
      }

      let placeholderContent = name;
      if (onVirtualFile) {
        try {
          const rendered = await onVirtualFile(moduleResult);
          if (typeof rendered === 'string') {
            placeholderContent = rendered;
          }
        } catch (callbackError) {
          moduleResult.error = moduleResult.error ?? callbackError;
        }
      }

      placeholder.value = placeholderContent;

      results.push(moduleResult);
    }

    if (emitToVFile) {
      // eslint-disable-next-line no-param-reassign
      (file.data ??= {}).mdxVirtualModules = results;
    }
  };

export { remarkMdxToMd, type RemarkMdxToMdModule, type RemarkMdxToMdOptions };
