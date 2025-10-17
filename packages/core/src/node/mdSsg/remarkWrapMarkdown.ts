import type { Root, RootContent } from 'mdast';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

/**
 * Custom remark plugin that wraps markdown content in React Fragment
 * Only processes top-level markdown nodes, keeps JSX elements and their children intact
 */
export function remarkWrapMarkdown(): (tree: Root) => void {
  return (tree: Root) => {
    const newChildren: any[] = [];

    for (const node of tree.children) {
      // Skip imports - they stay at top level
      if (node.type === 'mdxjsEsm') {
        newChildren.push(node);
        continue;
      }

      // Keep JSX elements completely as-is
      // Don't process their children - let MDX handle everything inside JSX
      if (
        node.type === 'mdxJsxFlowElement' ||
        node.type === 'mdxJsxTextElement'
      ) {
        newChildren.push(node);
        continue;
      }

      // For any other markdown node (heading, paragraph, blockquote, list, code, etc.)
      // wrap it in a Fragment with its raw text representation
      const textContent = serializeNodeToMarkdown(node);

      if (textContent) {
        newChildren.push({
          type: 'mdxJsxFlowElement',
          name: null, // Fragment
          attributes: [],
          children: [
            {
              type: 'text',
              value: textContent,
            },
          ],
        });
      }
    }

    tree.children = newChildren as any;
  };
}

/**
 * Serialize a markdown node back to its markdown text representation
 * Uses remark-stringify for proper serialization of all node types
 */
function serializeNodeToMarkdown(node: RootContent): string {
  // Create a temporary root node containing only this node
  const tempRoot: Root = {
    type: 'root',
    children: [node],
  };

  // Use unified with remark-stringify to convert the node back to markdown
  const processor = unified().use(remarkStringify, {
    bullet: '-',
    emphasis: '_',
    fences: true,
    incrementListMarker: true,
  });

  const result = processor.stringify(tempRoot);
  return result;
}
