import { MarkdownNode, reconciler, TextNode } from './reconciler.js';

// Convert node tree to Markdown string
function toMarkdown(root: MarkdownNode): string {
  const { type, props, children } = root;

  // Get children's Markdown
  const childrenMd = children
    .map(child => {
      if (child instanceof TextNode) {
        return child.text;
      }
      return toMarkdown(child);
    })
    .join('');

  // Generate corresponding Markdown based on element type
  switch (type) {
    case 'root':
      return childrenMd;
    case 'h1':
      return `# ${childrenMd}\n\n`;
    case 'h2':
      return `## ${childrenMd}\n\n`;
    case 'h3':
      return `### ${childrenMd}\n\n`;
    case 'h4':
      return `#### ${childrenMd}\n\n`;
    case 'h5':
      return `##### ${childrenMd}\n\n`;
    case 'h6':
      return `###### ${childrenMd}\n\n`;
    case 'p':
      return `${childrenMd}\n\n`;
    case 'strong':
    case 'b':
      return `**${childrenMd}**`;
    case 'em':
    case 'i':
      return `*${childrenMd}*`;
    case 'code':
      return `\`${childrenMd}\``;
    case 'pre': {
      const language = props.lang || props.language || '';
      return `\`\`\`${language}\n${childrenMd}\n\`\`\`\n\n`;
    }
    case 'a':
      return `[${childrenMd}](${props.href || '#'})`;
    case 'img':
      return `![${props.alt || ''}](${props.src || ''})`;
    case 'ul':
      return `${childrenMd}\n`;
    case 'ol':
      return `${childrenMd}\n`;
    case 'li': {
      const isOrdered = root.parent && root.parent.type === 'ol';
      const prefix = isOrdered ? '1. ' : '- ';
      return `${prefix}${childrenMd}\n`;
    }
    case 'blockquote':
      return `> ${childrenMd.split('\n').join('\n> ')}\n\n`;
    case 'br':
      return '\n';
    case 'hr':
      return '---\n\n';
    case 'table':
      return `${childrenMd}\n`;
    case 'thead':
      return childrenMd;
    case 'tbody':
      return childrenMd;
    case 'tr': {
      const cells = children
        .filter((child): child is MarkdownNode => child instanceof MarkdownNode)
        .map(cell => toMarkdown(cell).trim());

      // If it's a header row, add separator
      if (root.parent && root.parent.type === 'thead') {
        const separator = `|${cells.map(() => ' --- ').join('|')}|\n`;
        return `| ${cells.join(' | ')} |\n${separator}`;
      }

      return `| ${cells.join(' | ')} |\n`;
    }
    case 'th':
    case 'td':
      return childrenMd;
    case 'div':
    case 'span':
    case 'section':
    case 'article':
    case 'main':
    case 'aside':
    case 'header':
    case 'footer':
    case 'nav':
    default:
      return childrenMd;
  }
}

// Render function (SSR-like behavior: neither useEffect nor useLayoutEffect run)
export async function renderToMarkdownString(
  element: React.ReactElement,
): Promise<string> {
  const container = new MarkdownNode('root');

  const root = reconciler.createContainer(
    container,
    1, // tag (LegacyRoot = 0)
    null, // hydrationCallbacks
    false, // isStrictMode
    false, // concurrentUpdatesByDefaultOverride
    '', // identifierPrefix
    (...args) => {
      if (process.env.DEBUG) {
        console.log('Reconciler Error:', ...args);
      }
    }, // onUncaughtError
    () => {}, // onCaughtError
    (...args) => {
      if (process.env.DEBUG) {
        console.log('Reconciler onRecoverable Error:', ...args);
      }
    }, // onRecoverableError
    () => {}, // transitionCallbacks
    null, // onPostPaintCallback
  );

  // Set up a promise that resolves when commit completes
  let resolveCommit: ((arg: string) => void) | null = null;
  const commitPromise = new Promise<string>(resolve => {
    resolveCommit = resolve;
  });

  reconciler.updateContainer(element, root, null, () => {
    // This callback is called after commit
    if (resolveCommit) {
      resolveCommit(toMarkdown(container));
    }
  });

  return commitPromise;
}
