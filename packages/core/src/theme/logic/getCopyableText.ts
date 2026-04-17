export interface GetCopyableTextOptions {
  ignoreClasses?: string[];
  ignoreSelectors?: string[];
}

export function getCopyableText(
  element: HTMLElement | null,
  options: GetCopyableTextOptions = {},
) {
  if (!element) {
    return '';
  }

  const { ignoreClasses = [], ignoreSelectors = [] } = options;

  const nodeFilter =
    element.ownerDocument.defaultView?.NodeFilter ?? NodeFilter;
  const walk = element.ownerDocument.createTreeWalker(
    element,
    nodeFilter.SHOW_TEXT,
  );

  let text = '';
  let node = walk.nextNode();
  const markdownState: MarkdownState = {
    seenNodes: new WeakSet<HTMLElement>(),
  };
  let previousBlock: HTMLElement | null = null;

  while (node) {
    const parentElement = node.parentElement;
    const shouldIgnore =
      !parentElement ||
      ignoreClasses.some(className =>
        parentElement.classList.contains(className),
      ) ||
      ignoreSelectors.some(selector => parentElement.closest(selector));

    if (!shouldIgnore) {
      const currentBlock = getBlockElement(parentElement, element);

      if (
        currentBlock &&
        previousBlock &&
        currentBlock !== previousBlock &&
        !text.endsWith('\n')
      ) {
        text += '\n';
      }

      text += toMarkdown(parentElement, markdownState);

      text += node.nodeValue ?? '';
      previousBlock = currentBlock;
    }

    node = walk.nextNode();
  }

  return text;
}

function getBlockElement(
  element: HTMLElement,
  rootElement: HTMLElement,
): HTMLElement | null {
  const blockElement = element.closest<HTMLElement>(
    'li, p, div, pre, blockquote',
  );
  if (!blockElement) {
    return null;
  }

  return rootElement.contains(blockElement) ? blockElement : null;
}

interface MarkdownState {
  seenNodes: WeakSet<HTMLElement>;
}

// This is a lightweight markdown adapter for DOM-based copy text extraction.
// We currently only cover the minimum node types needed by Prompt copy.
// If Prompt copy needs broader markdown fidelity in the future, replace this
// with a dedicated renderToMarkdownString-style conversion instead of growing
// ad-hoc rules here indefinitely.
function toMarkdown(node: Node, state: MarkdownState) {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const listItem = element.closest('li');

  if (listItem && !state.seenNodes.has(listItem)) {
    state.seenNodes.add(listItem);
    return toMarkdownListItem(listItem);
  }

  if (element.tagName === 'BR') {
    return '\n';
  }

  return '';
}

function toMarkdownListItem(listItem: HTMLElement) {
  const list = listItem.parentElement;
  if (!list) {
    return '- ';
  }

  if (list.tagName === 'OL') {
    const listItems = Array.from(list.children).filter(
      child => child.tagName === 'LI',
    );
    const index = listItems.indexOf(listItem);
    return `${index + 1}. `;
  }

  return '- ';
}
