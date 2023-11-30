import { headingRank } from 'hast-util-heading-rank';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';
import { extractTextAndId } from '../../utils';

/**
 * Generate `id`s for headings and applies to headings with `id`s.
 * same as rehype-slug + rehype-autolink-headings, but support custom id.
 */
export const rehypeHeaderAnchor: Plugin<[], Root> = () => {
  const slugger = new GithubSlugger();
  return function (tree) {
    visit(tree, 'element', function (node) {
      if (headingRank(node as any)) {
        // generate id
        if (!node.properties.id) {
          const [text, customId] = collectHeaderText(node);
          node.properties.id = customId || slugger.slug(text);
        }
        // apply to headings
        node.children.unshift(create(node));
      }
    });
  };
};

export const collectHeaderText = (node: Element) => {
  let text = '';
  let id = '';
  node.children.forEach(child => {
    if (child.type === 'text') {
      const [textPart, idPart] = extractTextAndId(child.value);
      child.value = textPart;
      text += textPart;
      id = idPart;
    }
    if (child.type === 'element') {
      child.children.forEach(c => {
        if (c.type === 'text') {
          text += c.value;
        }
      });
    }
  });
  return [text, id];
};

/**
 * Create an `a`.
 *
 * @param {Readonly<Element>} node
 *   Related heading.
 * @returns {Element}
 *   Link.
 */
function create(node: Element): Element {
  return {
    type: 'element',
    tagName: 'a',
    properties: {
      class: 'header-anchor',
      ariaHidden: 'true',
      href: `#${node.properties.id}`,
    },
    children: [
      {
        type: 'text',
        value: '#',
      },
    ],
  };
}
