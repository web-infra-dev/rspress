import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { compile } from '@mdx-js/mdx';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

type RemarkMdxToMdPayload = {
  mdx: string;
  compiled?: string;
  runtime?: unknown;
  error?: unknown;
};

type RemarkMdxToMdOptions = {
  /** Callback receiving the gathered virtual JS content and optional compiled/runtime artifacts. */
  onVirtualFile?: (payload: RemarkMdxToMdPayload) => void;
  /**
   * Persist the virtual JS code on the vfile via `file.data.mdxVirtualJs`.
   * Enabled by default so downstream plugins can consume it.
   */
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
    const mdxSnippets: string[] = [];

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
        mdxSnippets.push(source.trimEnd());
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
        const source = collectSource(node);
        if (source) {
          mdxSnippets.push(source.trimEnd());
        }

        // derive a component name for placeholder
        let compName = 'Component';
        if (node && typeof node === 'object') {
          if (typeof node.name === 'string') compName = node.name;
          else if (node?.tagName && typeof node.tagName === 'string')
            compName = node.tagName;
          else if (node?.name && typeof node.name === 'object')
            compName = node.name.name ?? node.name.value ?? compName;
        }

        const placeholder = { type: 'html', value: `<!--${compName} ->` };

        if (
          parent &&
          typeof index === 'number' &&
          Array.isArray(parent.children)
        ) {
          // replace the node with a single html placeholder comment
          parent.children.splice(index, 1, placeholder);
          return SKIP;
        }

        return SKIP;
      });
    };

    handleJsx('mdxJsxFlowElement');
    handleJsx('mdxJsxTextElement');

    const virtualJs = mdxSnippets.join('\n\n').trim();

    if (virtualJs) {
      const finalCode = `${virtualJs}\n`;
      // emit original mdx snippets
      if (emitToVFile) {
        // eslint-disable-next-line no-param-reassign
        (file.data ??= {}).mdxVirtualJs = finalCode;
      }

      // compile to JS using @mdx-js/mdx
      try {
        const compiled = await compile(finalCode, {
          // produce JavaScript program output
          outputFormat: 'program',
        });
        const compiledCode = String(compiled);

        let runtimeResult: unknown;
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
            runtimeResult = await Promise.resolve(exported());
          } else {
            runtimeResult = exported;
          }
        } catch (runtimeError) {
          runtimeResult = {
            error:
              runtimeError instanceof Error
                ? runtimeError.message
                : String(runtimeError),
          };
        } finally {
          await fs.rm(tempFile, { force: true }).catch(() => {});
        }

        if (emitToVFile) {
          (file.data ??= {}).mdxVirtualJsJs = compiledCode;
          (file.data ??= {}).mdxVirtualRuntime = runtimeResult;
        }
        onVirtualFile?.({
          mdx: finalCode,
          compiled: compiledCode,
          runtime: runtimeResult,
        });
      } catch (error) {
        // if compile fails, still surface original mdx to callback
        onVirtualFile?.({ mdx: finalCode, error });
      }
    }
  };

export { remarkMdxToMd, type RemarkMdxToMdOptions, type RemarkMdxToMdPayload };
