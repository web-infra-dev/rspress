import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';

import { getCopyableText } from './getCopyableText';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const SHOW_TEXT = 4;

type FakeNode = FakeElement | FakeTextNode;

interface FakeTextNode {
  nodeType: number;
  nodeName: '#text';
  nodeValue: string;
  parentElement: FakeElement;
  previousSibling: FakeNode | null;
}

interface FakeElement {
  nodeType: number;
  nodeName: string;
  tagName: string;
  ownerDocument: FakeDocument;
  parentElement: FakeElement | null;
  previousSibling: FakeNode | null;
  childNodes: FakeNode[];
  children: FakeElement[];
  classList: {
    contains: (className: string) => boolean;
  };
  closest: (selector: string) => FakeElement | null;
  contains: (node: FakeElement) => boolean;
}

interface FakeDocument {
  defaultView: {
    NodeFilter: {
      SHOW_TEXT: number;
    };
  };
  createTreeWalker: (
    root: FakeElement,
    whatToShow: number,
  ) => {
    nextNode: () => FakeTextNode | null;
  };
}

const globalScope = globalThis as typeof globalThis & {
  Node?: typeof Node;
};

let originalNode: typeof Node | undefined;

beforeEach(() => {
  originalNode = globalScope.Node;
  globalScope.Node = {
    ELEMENT_NODE,
  } as typeof Node;
});

afterEach(() => {
  if (originalNode) {
    globalScope.Node = originalNode;
  } else {
    delete globalScope.Node;
  }
});

function createDocument(): FakeDocument {
  return {
    defaultView: {
      NodeFilter: {
        SHOW_TEXT,
      },
    },
    createTreeWalker(root: FakeElement, whatToShow: number) {
      if (whatToShow !== SHOW_TEXT) {
        throw new Error('This test document only supports text node walking');
      }

      const textNodes: FakeTextNode[] = [];
      const visit = (node: FakeNode) => {
        if (node.nodeType === TEXT_NODE) {
          textNodes.push(node);
          return;
        }

        for (const child of node.childNodes) {
          visit(child);
        }
      };

      visit(root);

      let index = -1;
      return {
        nextNode: () => {
          index += 1;
          return textNodes[index] ?? null;
        },
      };
    },
  };
}

function createElement(
  ownerDocument: FakeDocument,
  tagName: string,
  classNames: string[] = [],
): FakeElement {
  const element: FakeElement = {
    nodeType: ELEMENT_NODE,
    nodeName: tagName,
    tagName,
    ownerDocument,
    parentElement: null,
    previousSibling: null,
    childNodes: [],
    children: [],
    classList: {
      contains: className => classNames.includes(className),
    },
    closest(selector: string) {
      const targets = selector
        .split(',')
        .map(item => item.trim().toUpperCase())
        .filter(Boolean);

      let current: FakeElement | null = element;
      while (current) {
        if (targets.includes(current.tagName)) {
          return current;
        }
        current = current.parentElement;
      }

      return null;
    },
    contains(node: FakeElement) {
      const visit = (current: FakeElement): boolean => {
        if (current === node) {
          return true;
        }

        return current.childNodes.some(child => {
          if (child.nodeType !== ELEMENT_NODE) {
            return false;
          }

          return visit(child);
        });
      };

      return visit(element);
    },
  };

  return element;
}

function createText(ownerDocument: FakeDocument, value: string): FakeTextNode {
  return {
    nodeType: TEXT_NODE,
    nodeName: '#text',
    nodeValue: value,
    parentElement: null as unknown as FakeElement,
    previousSibling: null,
  };
}

function appendChild(parent: FakeElement, child: FakeNode) {
  child.parentElement = parent;
  child.previousSibling =
    parent.childNodes[parent.childNodes.length - 1] ?? null;
  parent.childNodes.push(child);

  if (child.nodeType === ELEMENT_NODE) {
    parent.children.push(child);
  }
}

describe('getCopyableText', () => {
  let document: FakeDocument;

  beforeEach(() => {
    document = createDocument();
  });

  it('copies code blocks inside list items without list markers', () => {
    const ol = createElement(document, 'OL');
    const li = createElement(document, 'LI');
    const p = createElement(document, 'P');
    const pre = createElement(document, 'PRE');
    const code = createElement(document, 'CODE');
    const codeText = createText(document, 'npm install package-name');

    appendChild(ol, li);
    appendChild(li, p);
    appendChild(li, pre);
    appendChild(pre, code);
    appendChild(code, codeText);

    const result = getCopyableText(code as unknown as HTMLElement);

    expect(result).toBe('npm install package-name');
  });

  it('copies code blocks with unordered list markers suppressed', () => {
    const ul = createElement(document, 'UL');
    const li = createElement(document, 'LI');
    const pre = createElement(document, 'PRE');
    const code = createElement(document, 'CODE');
    const codeText = createText(document, 'docker run image');

    appendChild(ul, li);
    appendChild(li, pre);
    appendChild(pre, code);
    appendChild(code, codeText);

    const result = getCopyableText(code as unknown as HTMLElement);

    expect(result).toBe('docker run image');
  });

  it('preserves list markers for regular list content', () => {
    const ul = createElement(document, 'UL');
    const firstLi = createElement(document, 'LI');
    const secondLi = createElement(document, 'LI');
    const firstText = createText(document, 'First step');
    const secondText = createText(document, 'Second step');

    appendChild(ul, firstLi);
    appendChild(ul, secondLi);
    appendChild(firstLi, firstText);
    appendChild(secondLi, secondText);

    const result = getCopyableText(ul as unknown as HTMLElement);

    expect(result).toBe('- First step\n- Second step');
  });

  it('handles nested code inside list items', () => {
    const ol = createElement(document, 'OL');
    const li = createElement(document, 'LI');
    const pre = createElement(document, 'PRE');
    const code = createElement(document, 'CODE');
    const codeText = createText(document, 'command1 arg1\ncommand2 arg2');

    appendChild(ol, li);
    appendChild(li, pre);
    appendChild(pre, code);
    appendChild(code, codeText);

    const result = getCopyableText(pre as unknown as HTMLElement);

    expect(result).toBe('command1 arg1\ncommand2 arg2');
  });
});
