/**
 * 🚀 This plugin is used to support container directive in unified.
 * Taking into account the compatibility of the VuePress/Docusaurus container directive, current remark plugin in unified ecosystem only supports the following syntax:
 * ::: tip {title="foo"}
 * This is a tip
 * :::
 * But the following syntax is not supported:
 * ::: tip foo
 * This is a tip
 * :::
 * In fact, the syntax is usually used in SSG Frameworks, such as VuePress/Docusaurus.
 * So the plugin is used to solve the problem and support both syntaxes in above cases.
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

export type DirectiveType = (typeof DIRECTIVE_TYPES)[number];

const trimTailingQuote = (str: string) => str.replace(/['"]$/g, '');

const parseTitle = (rawTitle = '', isMDX = false) => {
  const matched = rawTitle?.match(
    isMDX ? TITLE_REGEX_IN_MDX : TITLE_REGEX_IN_MD,
  );
  return trimTailingQuote(matched?.[1] || rawTitle);
};

/**
 * Construct the DOM structure of the container directive.
 * For example:
 *
 * ::: tip {title="foo"}
 * This is a tip
 * :::
 *
 * will be transformed to:
 *
 * <div class="rspress-directive tip">
 *   <div class="rspress-directive-title">TIP</div>
 *   <div class="rspress-directive-content">
 *     <p>This is a tip</p>
 *   </div>
 * </div>
 *
 */
const createContainer = (
  type: DirectiveType | string,
  title: string | undefined,
  children: (BlockContent | PhrasingContent)[],
): ContainerDirective => {
  const isDetails = type === 'details';

  const rootHName = isDetails ? 'details' : 'div';
  const titleHName = isDetails ? 'summary' : 'div';

  return {
    type: 'containerDirective',
    name: type,
    data: {
      hName: rootHName,
      hProperties: {
        class: `rspress-directive ${type}`,
      },
    },
    children: [
      {
        type: 'paragraph',
        data: {
          hName: titleHName,
          hProperties: {
            class: 'rspress-directive-title',
          },
        },
        children: [{ type: 'text', value: title || type.toUpperCase() }],
      },
      {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { class: 'rspress-directive-content' },
        },
        children: children as PhrasingContent[],
      },
    ],
  };
};

/**
 * How the transformer works:
 * 1. We get the paragraph and check if it is a container directive
 * 2. If it is, crawl the next nodes, if there is a paragraph node, we need to check if it is the end of the container directive. If not, we need to push it to the children of the container directive node.
 * 3. If we find the end of the container directive, we remove the visited node and insert the custom container directive node.
 */
function transformer(tree: Parent) {
  let i = 0;
  try {
    while (i < tree.children.length) {
      const node = tree.children[i];

      if ('children' in node) {
        transformer(node);
      }

      if (node.type === 'containerDirective') {
        const type = node.name as DirectiveType;
        if (DIRECTIVE_TYPES.includes(type)) {
          tree.children.splice(
            i,
            1,
            createContainer(
              type,
              node.attributes?.title ?? type.toUpperCase(),
              node.children as BlockContent[],
            ) as RootContent,
          );
        }
      } else if (
        /**
         * Support for Github Alerts
         * > [!TIP]
         * > This is a tip
         *
         * will be transformed to:
         *
         * <div class="rspress-directive tip">
         *   <div class="rspress-directive-title">TIP</div>
         *   <div class="rspress-directive-content">
         *     <p>This is a tip</p>
         *   </div>
         * </div>
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

      if (
        node.type !== 'paragraph' ||
        // 1. We get the paragraph and check if it is a container directive
        node.children[0].type !== 'text'
      ) {
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
        i++;
        continue;
      }
      // 2. If it is, we remove the paragraph and create a container directive
      const wrappedChildren: (BlockContent | PhrasingContent)[] = [];
      // 2.1 case: with no newline between `:::` and `:::`, for example
      // ::: tip
      // This is a tip
      // :::
      // Here the content is `::: tip\nThis is a tip\n:::`
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
        // 2.2 case: with newline before the end of container, for example:
        // ::: tip
        // This is a tip
        //
        // :::
        // Here the content is `::: tip\nThis is a tip`
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

        // 2.3 The final case: has newline after the start of container, for example:
        // ::: tip
        //
        // This is a tip
        // :::

        // All of the above cases need to crawl the children of the container directive node.
        // In other word, We look for the next paragraph nodes and collect all the content until we find the end of the container directive
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
            // 3. We find the end of the container directive
            // Then create the container directive, and remove the original paragraphs
            // Finally, we insert the new container directive and break the loop
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
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export const remarkContainerSyntax: Plugin<[], Root> = () => {
  return transformer;
};
