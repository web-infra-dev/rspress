/**
 * 🚀 This plugin is used to support container directive in unified.
 * This implementation uses remark-directive for standard directive syntax,
 * while keeping custom parsing for VuePress/Docusaurus-style syntax.
 *
 * Standard remark-directive syntax: :::tip{title="foo"}
 * VuePress/Docusaurus syntax: ::: tip foo
 *
 * Both are supported.
 */
/// <reference types="mdast-util-mdx-expression" />

import type {
  BlockContent,
  Literal,
  Paragraph,
  Parent,
  PhrasingContent,
  Root,
  RootContent,
} from 'mdast';
import type { ContainerDirective } from 'mdast-util-directive';
import type { Plugin } from 'unified';
import { getNamedImportAstNode } from '../../utils';

export const DIRECTIVE_TYPES = [
  'tip',
  'note',
  'warning',
  'caution',
  'danger',
  'info',
  'details',
] as const;
export const REGEX_BEGIN = /^\s*:::\s*(\w+)\s*(.*)?/;
export const REGEX_END = /\s*:::$/;
export const REGEX_GH_BEGIN = /^\s*\s*\[!(\w+)\]\s*(.*)?/;
export const TITLE_REGEX_IN_MD = /{\s*title=["']?(.+)}\s*/;
export const TITLE_REGEX_IN_MDX = /\s*title=["']?(.+)\s*/;

const CALLOUT_COMPONENT = '$$$callout$$$';
const ERROR_PREFIX = '[remarkContainerSyntax]';

export type DirectiveType = (typeof DIRECTIVE_TYPES)[number];

const trimTailingQuote = (str: string) => str.replace(/['"]$/g, '');

const parseTitle = (rawTitle = '', isMDX = false) => {
  const matched = rawTitle?.match(
    isMDX ? TITLE_REGEX_IN_MDX : TITLE_REGEX_IN_MD,
  );
  return trimTailingQuote(matched?.[1] || rawTitle);
};

const getTypeName = (type: DirectiveType | string): string => {
  return type[0].toUpperCase() + type.slice(1).toLowerCase();
};

/**
 * Construct the DOM structure of the container directive.
 */
const createContainer = (
  type: DirectiveType | string,
  title: string | undefined,
  children: (BlockContent | PhrasingContent)[],
): ContainerDirective => {
  return {
    type: 'containerDirective',
    name: CALLOUT_COMPONENT,
    attributes: {
      type: type,
      title: title || getTypeName(type),
    },
    data: {
      hName: CALLOUT_COMPONENT,
      hProperties: {
        type: type,
        title: title || getTypeName(type),
      },
    },
    children: children as BlockContent[],
  };
};

/**
 * Transform containerDirective nodes created by remark-directive
 * and handle VuePress/Docusaurus syntax that remark-directive doesn't support
 */
function transformer(
  tree: Parent,
  warnUnknownType: (type: string | undefined) => void,
) {
  let i = 0;
  while (i < tree.children.length) {
    const node = tree.children[i];

    if ('children' in node) {
      transformer(node, warnUnknownType);
    }

    // Handle containerDirective nodes from remark-directive
    if (node.type === 'containerDirective') {
      const type = node.name as string;
      if (type === CALLOUT_COMPONENT) {
        i++;
        continue;
      }
      if (DIRECTIVE_TYPES.includes(type as DirectiveType)) {
        tree.children.splice(
          i,
          1,
          createContainer(
            type,
            node.attributes?.title ?? getTypeName(type),
            node.children as BlockContent[],
          ) as RootContent,
        );
      } else {
        warnUnknownType(type);
      }
    } else if (
      /**
       * Support for Github Alerts
       * > [!TIP]
       * > This is a tip
       */
      node.type === 'blockquote' &&
      node.children[0]?.type === 'paragraph' &&
      node.children[0].children?.[0] &&
      'value' in node.children[0].children[0]
    ) {
      const initiatorTag = node.children[0].children[0].value;
      const match = initiatorTag.match(REGEX_GH_BEGIN);

      if (match) {
        const [, type] = match;
        if (!DIRECTIVE_TYPES.includes(type.toLowerCase() as DirectiveType)) {
          warnUnknownType(type);
          i++;
          continue;
        }
        if (
          node.children.length === 1 &&
          node.children[0].type === 'paragraph'
        ) {
          node.children[0].children[0].value = match[2] ?? '';
        }
        const newChild = createContainer(
          type.toLowerCase(),
          type.toUpperCase(),
          (node.children.slice(1).length === 0
            ? node.children.slice(0)
            : node.children.slice(1)) as BlockContent[],
        );
        tree.children.splice(i, 1, newChild as RootContent);
      }
    }

    // Handle VuePress/Docusaurus-style syntax that remark-directive doesn't support
    // E.g., ::: tip Custom Title (with space and plain text)
    if (node.type !== 'paragraph' || node.children[0].type !== 'text') {
      i++;
      continue;
    }

    const firstTextNode = node.children[0];
    const text = firstTextNode.value;
    const metaText = text.split('\n')[0];
    const content = text.slice(metaText.length);
    const match = metaText.match(REGEX_BEGIN);
    if (!match) {
      i++;
      continue;
    }
    const [, type, rawTitle] = match;
    // In .md, we can get :::tip{title="foo"} in the first text node
    // In .mdx, we get :::tip in first node and {title="foo"} in second node
    let title = parseTitle(rawTitle);
    // :::tip{title="foo"}
    const titleExpressionNode =
      node.children[1] && node.children[1].type === 'mdxTextExpression'
        ? node.children[1]
        : null;
    // Handle the case of `::: tip {title="foo"}`
    if (titleExpressionNode) {
      title = parseTitle((titleExpressionNode as Literal).value, true);
      // {title="foo"} is not a part of the content, So we need to remove it
      node.children.splice(1, 1);
    }
    if (!DIRECTIVE_TYPES.includes(type as DirectiveType)) {
      warnUnknownType(type);
      i++;
      continue;
    }
    // Create container directive from VuePress/Docusaurus syntax
    const wrappedChildren: (BlockContent | PhrasingContent)[] = [];
    // Case with no newline between `:::` and `:::`
    if (content?.endsWith(':::')) {
      wrappedChildren.push({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: content.replace(REGEX_END, ''),
          },
        ],
      });
      const newChild = createContainer(type, title, wrappedChildren);
      tree.children.splice(i, 1, newChild as RootContent);
    } else {
      // Case with newline before the end of container
      const paragraphChild: Paragraph = {
        type: 'paragraph',
        children: [] as PhrasingContent[],
      };
      wrappedChildren.push(paragraphChild);
      if (content.length) {
        paragraphChild.children.push({
          type: 'text',
          value: content,
        });
      }
      paragraphChild.children.push(...node.children.slice(1, -1));
      // If the inserted paragraph is empty, we remove it
      if (paragraphChild.children.length === 0) {
        wrappedChildren.pop();
      }
      const lastChildInNode = node.children[node.children.length - 1];
      // We find the end of the container directive in current paragraph
      if (
        lastChildInNode.type === 'text' &&
        REGEX_END.test(lastChildInNode.value)
      ) {
        const lastChildInNodeText = lastChildInNode.value;
        const matchedEndContent = lastChildInNodeText.slice(0, -3).trimEnd();
        // eslint-disable-next-line max-depth
        if (wrappedChildren.length) {
          (wrappedChildren[0] as Paragraph).children.push({
            type: 'text',
            value: matchedEndContent,
          });
        } else if (matchedEndContent) {
          wrappedChildren.push({
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: matchedEndContent,
              },
            ],
          });
        }
        const newChild = createContainer(type, title, wrappedChildren);
        tree.children.splice(i, 1, newChild as RootContent);
        i++;
        continue;
      }

      if (lastChildInNode !== firstTextNode && wrappedChildren.length) {
        // We don't find the end of the container directive in current paragraph
        (wrappedChildren[0] as Paragraph).children.push(lastChildInNode);
      }

      // The final case: has newline after the start of container
      // Look for the next paragraph nodes and collect all the content until we find the end
      let j = i + 1;
      while (j < tree.children.length) {
        const currentParagraph = tree.children[j];
        if (currentParagraph.type !== 'paragraph') {
          wrappedChildren.push(currentParagraph as BlockContent);
          j++;
          continue;
        }
        const lastChild =
          currentParagraph.children[currentParagraph.children.length - 1];
        // The whole paragraph doesn't arrive at the end of the container directive, we collect the whole paragraph
        if (
          lastChild !== firstTextNode &&
          (lastChild.type !== 'text' || !REGEX_END.test(lastChild.value))
        ) {
          wrappedChildren.push({
            ...currentParagraph,
            children: currentParagraph.children.filter(
              child => child !== firstTextNode,
            ),
          });
          j++;
        } else {
          // We find the end of the container directive
          const lastChildText = lastChild.value;
          const matchedEndContent = lastChildText.slice(0, -3).trimEnd();
          const filteredChildren = currentParagraph.children.filter(
            child => child !== firstTextNode && child !== lastChild,
          );

          if (matchedEndContent) {
            wrappedChildren.push({
              type: 'paragraph',
              children: [
                ...filteredChildren,
                {
                  type: 'text',
                  value: matchedEndContent,
                },
              ],
            });
          } else {
            wrappedChildren.push(...filteredChildren);
          }

          const newChild = createContainer(type, title, wrappedChildren);
          tree.children.splice(i, j - i + 1, newChild as RootContent);
          break;
        }
      }
    }
    i++;
  }
}

export const remarkContainerSyntax: Plugin<[], Root> = () => {
  const unknownTypes = new Set<string>();

  const warnUnknownType = (type: string | undefined) => {
    if (!type || type === CALLOUT_COMPONENT) {
      return;
    }
    if (unknownTypes.has(type)) {
      return;
    }
    unknownTypes.add(type);
    const supportedTypes = DIRECTIVE_TYPES.join(', ');
    throw new Error(
      `${ERROR_PREFIX} Unknown container directive type "${type}". Supported types: ${supportedTypes}`,
    );
  };

  return tree => {
    transformer(tree, warnUnknownType);
    tree.children.unshift(
      getNamedImportAstNode('Callout', CALLOUT_COMPONENT, '@theme'),
    );
  };
};
