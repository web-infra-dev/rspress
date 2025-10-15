import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

type RemarkMdxToMdOptions = {
  /** Callback receiving the gathered virtual JS content. */
  onVirtualFile?: (code: string) => void;
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
  (tree, file) => {
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
      if (emitToVFile) {
        // eslint-disable-next-line no-param-reassign
        (file.data ??= {}).mdxVirtualJs = finalCode;
      }
      onVirtualFile?.(finalCode);
    }
  };

export { remarkMdxToMd, type RemarkMdxToMdOptions };
