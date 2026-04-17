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
  const seenListItems = new WeakSet<HTMLElement>();
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
      const listItem = parentElement.closest('li');
      const currentBlock = getBlockElement(parentElement, element);

      if (
        currentBlock &&
        previousBlock &&
        currentBlock !== previousBlock &&
        !text.endsWith('\n')
      ) {
        text += '\n';
      }

      if (listItem && !seenListItems.has(listItem)) {
        text += getListItemPrefix(listItem);
        seenListItems.add(listItem);
      }

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
  const blockElement = element.closest('li, p, div, pre, blockquote');
  if (!blockElement) {
    return null;
  }

  return rootElement.contains(blockElement) ? blockElement : null;
}

function getListItemPrefix(listItem: HTMLElement) {
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
