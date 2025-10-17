import { setTimeout } from 'timers/promises';
import {
  lastRootNode,
  MarkdownNode,
  reconciler,
  TextNode,
} from './reconciler.js';

// 将节点树转换为 Markdown 字符串
function toMarkdown(root: MarkdownNode): string {
  const { type, props, children } = root;

  // 获取子元素的 Markdown
  const childrenMd = children
    .map(child => {
      if (child instanceof TextNode) {
        return child.text;
      }
      return toMarkdown(child);
    })
    .join('');

  // 根据元素类型生成对应的 Markdown
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

      // 如果是表头行，添加分隔符
      if (root.parent && root.parent.type === 'thead') {
        const separator = '|' + cells.map(() => ' --- ').join('|') + '|\n';
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

// 渲染函数
export async function renderToMarkdownString(
  element: React.ReactElement,
): Promise<string> {
  console.log('renderToMd called with element:', element);
  const container = new MarkdownNode('root');
  // _renderCompleted = false;
  // lastRootNode = null;

  const root = reconciler.createContainer(
    container,
    0,
    null,
    false,
    false,
    '',
    console.error,
    () => {},
    () => {},
    () => {},
    null,
  );

  reconciler.updateContainer(element, root, null, null);

  await setTimeout(0);
  const result = lastRootNode ? toMarkdown(lastRootNode) : '';
  console.log('=======\n', result, '==================');

  return result;
}
