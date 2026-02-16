import React from 'react';
import { MarkdownNode, reconciler, TextNode } from './reconciler.js';

// Access React internals to intercept the hooks dispatcher.
// React's Fizz server renderer (renderToString) sets useEffect/useLayoutEffect
// to noop in its HooksDispatcher. We replicate this by intercepting the H
// property on ReactSharedInternals during our render pass.
// https://github.com/facebook/react/blob/c3b0e20e4/packages/react/src/ReactSharedInternals.js
// https://github.com/facebook/react/blob/c3b0e20e4/packages/react-server/src/ReactFizzHooks.js#L817-L822
const ReactSharedInternals: Record<string, unknown> | null = (
  React as Record<string, unknown>
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE as Record<
  string,
  unknown
> | null;

function noop(): void {}

/**
 * Intercept the React hooks dispatcher so that useEffect, useLayoutEffect,
 * and useInsertionEffect become no-ops — matching React Fizz SSR behavior.
 *
 * Uses a refcount so multiple concurrent renderToMarkdownString calls
 * (e.g. via p-map) safely share a single interceptor and only restore the
 * original descriptor when the last render completes.
 *
 * Returns a cleanup function that decrements the refcount.
 */
let interceptorRefCount = 0;
let originalDescriptor: PropertyDescriptor | undefined;
let realH: Record<string, unknown> | null = null;
let cachedTarget: unknown = null;
let cachedProxy: unknown = null;

function installEffectInterceptor(): () => void {
  if (!ReactSharedInternals) {
    return noop;
  }

  interceptorRefCount++;
  if (interceptorRefCount === 1) {
    // First caller — save the original descriptor and install the interceptor.
    originalDescriptor = Object.getOwnPropertyDescriptor(
      ReactSharedInternals,
      'H',
    );
    realH = ReactSharedInternals.H as Record<string, unknown> | null;
    cachedTarget = null;
    cachedProxy = null;

    Object.defineProperty(ReactSharedInternals, 'H', {
      get() {
        if (realH == null) {
          return realH;
        }
        // Cache the proxy per dispatcher identity to avoid creating a new one
        // on every property access.
        if (cachedTarget !== realH) {
          cachedTarget = realH;
          cachedProxy = new Proxy(realH, {
            get(target, prop, receiver) {
              if (
                prop === 'useEffect' ||
                prop === 'useLayoutEffect' ||
                prop === 'useInsertionEffect'
              ) {
                return noop;
              }
              return Reflect.get(target, prop, receiver);
            },
          });
        }
        return cachedProxy;
      },
      set(value) {
        realH = value;
      },
      configurable: true,
    });
  }

  return () => {
    interceptorRefCount--;
    if (interceptorRefCount === 0) {
      // Last caller — restore the original property descriptor.
      if (originalDescriptor) {
        Object.defineProperty(ReactSharedInternals, 'H', originalDescriptor);
      } else {
        delete (ReactSharedInternals as Record<string, unknown>).H;
        ReactSharedInternals.H = realH;
      }
    }
  };
}

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
      // When <code> is nested inside <pre>, it represents the code block body,
      // so we must not wrap it with inline backticks (would create nested fences).
      if (root.parent?.type === 'pre') {
        return childrenMd;
      }
      return `\`${childrenMd}\``;
    case 'pre': {
      const _language =
        props['data-lang'] || props.language || props.lang || '';

      const language = typeof _language === 'string' ? _language : '';
      const title = props['data-title'] || '';
      const block = ['markdown', 'mdx', 'md', ''].includes(language)
        ? '````'
        : '```';

      return `\n${block}${language}${title ? ` title=${title}` : ''}\n${childrenMd}\n${block}\n`;
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
    1, // tag (ConcurrentRoot = 1)
    null, // hydrationCallbacks
    false, // isStrictMode
    false, // concurrentUpdatesByDefaultOverride
    '', // identifierPrefix
    (error, info) => {
      if (process.env.DEBUG) {
        console.error('Reconciler Error:', error, info);
        const message = `Reconciler Error:${error.message}`;
        throw new Error(message);
      }
    }, // onUncaughtError
    () => {}, // onCaughtError
    (...args) => {
      if (process.env.DEBUG) {
        console.log('Reconciler onRecoverable Error:', ...args);
      }
    }, // onRecoverableError
    () => {}, // onDefaultTransitionIndicator
  );

  // Intercept the React hooks dispatcher to make useEffect / useLayoutEffect
  // / useInsertionEffect no-ops, matching React Fizz SSR behavior.
  const removeInterceptor = installEffectInterceptor();

  try {
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

    return await commitPromise;
  } finally {
    removeInterceptor();
  }
}
