import { logger } from '@rsbuild/core';
import { createContext } from 'react';
import createReconciler, { type ReactContext } from 'react-reconciler';
import {
  DefaultEventPriority,
  NoEventPriority,
} from 'react-reconciler/constants.js';

// Define types
type ElementNames = string;
type Props = Record<string, unknown>;
type HostContext = {
  isInsideText: boolean;
};

// Text node class
export class TextNode {
  public text: string;
  public parent?: MarkdownNode;

  constructor(text: string) {
    this.text = text;
  }

  setText(text: string): void {
    this.text = text;
  }
}

// Markdown node class
export class MarkdownNode {
  public type: string;
  public props: Record<string, unknown>;
  public children: (MarkdownNode | TextNode)[];
  public parent?: MarkdownNode;

  constructor(type: string, props: Record<string, unknown> = {}) {
    this.type = type;
    this.props = props;
    this.children = [];
  }

  appendChild(child: MarkdownNode | TextNode): void {
    logger.debug('MarkdownNode.appendChild called: %O', {
      parentType: this.type,
      childType:
        child instanceof TextNode
          ? `TextNode("${child.text}")`
          : `MarkdownNode(${child.type})`,
      childrenBefore: this.children.length,
    });

    this.children.push(child);
    if ('parent' in child) {
      child.parent = this;
    }

    logger.debug('MarkdownNode.appendChild completed: %O', {
      childrenAfter: this.children.length,
    });
  }

  removeChild(child: MarkdownNode | TextNode): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  insertBefore(
    child: MarkdownNode | TextNode,
    beforeChild: MarkdownNode | TextNode,
  ): void {
    const index = this.children.indexOf(beforeChild);
    if (index !== -1) {
      this.children.splice(index, 0, child);
    } else {
      this.appendChild(child);
    }
    if ('parent' in child) {
      child.parent = this;
    }
  }
}

// Current update priority
let currentUpdatePriority = NoEventPriority;
// Last rendered result
export let lastRootNode: MarkdownNode | null = null;
// Render completion flag
export let _renderCompleted = false;

// Create React Reconciler config
const hostConfig = {
  // Basic capabilities
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: false,

  // Get root host context
  getRootHostContext(): HostContext {
    return { isInsideText: false };
  },

  // Get child host context
  getChildHostContext(
    parentHostContext: HostContext,
    type: string,
  ): HostContext {
    const previousIsInsideText = parentHostContext.isInsideText;
    // Determine whether this should be treated as text
    const isInsideText =
      type === 'text' || type === 'span' || previousIsInsideText;

    logger.debug('getChildHostContext: %O', {
      type,
      previousIsInsideText,
      isInsideText,
    });

    if (previousIsInsideText === isInsideText) {
      return parentHostContext;
    }

    return { isInsideText };
  },

  // Create instance
  createInstance(type: string, props: Props): MarkdownNode {
    logger.debug('createInstance: %O', { type, props });
    return new MarkdownNode(type, props);
  },

  // Create text instance
  createTextInstance(text: string): TextNode {
    logger.debug('createTextInstance: %O', { text });
    return new TextNode(text);
  },

  // Determine whether to set text content directly
  shouldSetTextContent(type: string, props: Props): boolean {
    logger.debug('shouldSetTextContent: %O', { type, props });
    // For simple text content, return false so React creates a text node
    return false;
  },

  // Append child
  appendChild(parent: MarkdownNode, child: MarkdownNode | TextNode): void {
    logger.debug('appendChild: %O', {
      parent: parent.type,
      child:
        child instanceof TextNode
          ? `TextNode("${child.text}")`
          : `MarkdownNode(${child.type})`,
    });
    parent.appendChild(child);
  },

  // Insert child before another
  insertBefore(
    parent: MarkdownNode,
    child: MarkdownNode | TextNode,
    beforeChild: MarkdownNode | TextNode,
  ): void {
    logger.debug('insertBefore: %O', {
      parent: parent.type,
      child,
      beforeChild,
    });
    parent.insertBefore(child, beforeChild);
  },

  // Remove child
  removeChild(parent: MarkdownNode, child: MarkdownNode | TextNode): void {
    parent.removeChild(child);
  },

  // Commit text update
  commitTextUpdate(
    textInstance: TextNode,
    _oldText: string,
    newText: string,
  ): void {
    textInstance.setText(newText);
  },

  // Prepare update
  prepareUpdate(): Record<string, never> {
    return {};
  },

  // Commit update
  commitUpdate(
    _instance: MarkdownNode,
    _type: string,
    _oldProps: Props,
    _newProps: Props,
    _internalHandle: unknown,
  ): void {
    // No special update logic in this simple implementation
  },

  // Finalize initial children
  finalizeInitialChildren(): boolean {
    return false;
  },

  // Clear container
  clearContainer(container: MarkdownNode): void {
    container.children = [];
  },

  // Handle update priority
  setCurrentUpdatePriority(newPriority: number): void {
    currentUpdatePriority = newPriority;
  },

  getCurrentUpdatePriority(): number {
    return currentUpdatePriority;
  },

  resolveUpdatePriority(): number {
    if (currentUpdatePriority !== NoEventPriority) {
      return currentUpdatePriority;
    }
    return DefaultEventPriority;
  },

  // Append initial child
  appendInitialChild(
    parent: MarkdownNode,
    child: MarkdownNode | TextNode,
  ): void {
    logger.debug('appendInitialChild: %O', {
      parent: parent.type,
      child:
        child instanceof TextNode
          ? `TextNode("${child.text}")`
          : `MarkdownNode(${child.type})`,
    });
    parent.appendChild(child);
  },

  preparePortalMount(): void {
    // Portal mount preparation logic
  },

  // Other required implementations
  resetTextContent(): void {},
  getPublicInstance(instance: MarkdownNode | TextNode) {
    return instance;
  },
  prepareForCommit(_containerInfo: MarkdownNode): null {
    logger.debug('prepareForCommit called');
    return null;
  },
  resetAfterCommit(containerInfo: MarkdownNode): void {
    logger.debug('resetAfterCommit called, containerInfo: %O', containerInfo);
    logger.debug(
      'resetAfterCommit containerInfo.children: %O',
      containerInfo.children,
    );
    lastRootNode = containerInfo;
    _renderCompleted = true;
  },
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  getCurrentEventPriority(): number {
    return DefaultEventPriority;
  },
  getInstanceFromNode(): null {
    return null;
  },
  beforeActiveInstanceBlur(): void {},
  afterActiveInstanceBlur(): void {},
  prepareScopeUpdate(): void {},
  getInstanceFromScope(): null {
    return null;
  },
  detachDeletedInstance(): void {},

  // Container related methods
  appendChildToContainer(
    container: MarkdownNode,
    child: MarkdownNode | TextNode,
  ): void {
    logger.debug('appendChildToContainer: %O', {
      container: container.type,
      child:
        child instanceof TextNode
          ? `TextNode("${child.text}")`
          : `MarkdownNode(${child.type})`,
    });
    container.appendChild(child);
  },

  insertInContainerBefore(
    container: MarkdownNode,
    child: MarkdownNode | TextNode,
    beforeChild: MarkdownNode | TextNode,
  ): void {
    logger.debug('insertInContainerBefore: %O', {
      container: container.type,
      child,
      beforeChild,
    });
    container.insertBefore(child, beforeChild);
  },

  removeChildFromContainer(
    container: MarkdownNode,
    child: MarkdownNode | TextNode,
  ): void {
    logger.debug('removeChildFromContainer: %O', {
      container: container.type,
      child,
    });
    container.removeChild(child);
  },

  hideInstance(_instance: MarkdownNode): void {
    // Logic to hide an instance; can set a flag here
  },

  hideTextInstance(textInstance: TextNode): void {
    textInstance.setText('');
  },

  unhideInstance(_instance: MarkdownNode): void {
    // Logic to unhide an instance
  },

  unhideTextInstance(textInstance: TextNode, text: string): void {
    textInstance.setText(text);
  },

  // React 18+ additional methods
  maySuspendCommit(): boolean {
    return false;
  },

  preloadInstance(): boolean {
    return true;
  },

  startSuspendingCommit(): void {},

  suspendInstance(): void {},

  waitForCommitToBeReady(): null {
    return null;
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  NotPendingTransition: null as unknown,

  // eslint-disable-next-line @typescript-eslint/naming-convention
  HostTransitionContext: createContext(
    null,
  ) as unknown as ReactContext<unknown>,

  resetFormInstance(): void {},

  requestPostPaintCallback(): void {},

  shouldAttemptEagerTransition(): boolean {
    return false;
  },

  trackSchedulerEvent(): void {},

  resolveEventType(): null {
    return null;
  },

  resolveEventTimeStamp(): number {
    return -1.1;
  },
};

// Create reconciler instance
export const reconciler = createReconciler<
  ElementNames,
  Props,
  MarkdownNode,
  MarkdownNode,
  TextNode,
  MarkdownNode,
  unknown,
  unknown,
  unknown,
  HostContext,
  unknown,
  unknown,
  unknown,
  unknown
>(hostConfig);
