/// <reference path="../../index.d.ts" />

import { useLang, usePageData } from '@rspress/core/runtime';
import { getCustomMDXComponent } from '@rspress/core/theme';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './API.css';
import GithubSlugger from 'github-slugger';
import type { Content, Element, Root } from 'hast';
// biome-ignore lint/style/useImportType: <exact>
import React from 'react';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

function headingRank(node: Root | Content): number | null {
  const name =
    (node && node.type === 'element' && node.tagName.toLowerCase()) || '';
  const code =
    name.length === 2 && name.charCodeAt(0) === 104 /* `h` */
      ? name.charCodeAt(1)
      : 0;
  return code > 48 /* `0` */ && code < 55 /* `7` */
    ? code - 48 /* `0` */
    : null;
}

const rehypeHeaderAnchor: Plugin<[], Root> = () => {
  const slugger = new GithubSlugger();
  return tree => {
    visit(tree, 'element', node => {
      if (!headingRank(node)) {
        return;
      }
      // generate id

      if (!node.properties?.id) {
        const text = collectHeaderText(node);
        node.properties ??= {};
        node.properties.id = slugger.slug(text);
      }
      // apply to headings
      node.children.unshift(create(node));
    });
  };
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
      href: `#${node.properties!.id}`,
    },
    children: [
      {
        type: 'text',
        value: '#',
      },
    ],
  };
}

const extractTextAndId = (title?: string): string => {
  if (!title) {
    return '';
  }
  const text = title.trimEnd();
  return text;
};

const collectHeaderText = (node: Element): string => {
  let text = '';
  node.children.forEach(child => {
    if (child.type === 'text') {
      const textPart = extractTextAndId(child.value);
      child.value = textPart;
      text += textPart;
    }
    if (child.type === 'element') {
      child.children.forEach(c => {
        if (c.type === 'text') {
          text += c.value;
        }
      });
    }
  });
  return text;
};

export default (props: { moduleName: string }) => {
  const lang = useLang();
  const { page } = usePageData();
  const { moduleName } = props;
  // some api doc have two languages.
  const apiDocMap = page.apiDocMap;
  // avoid error when no page data
  const apiDoc =
    apiDocMap?.[moduleName] || apiDocMap?.[`${moduleName}-${lang}`] || '';
  return (
    <div className="rspress-plugin-api-docgen">
      <ReactMarkdown
        remarkPlugins={[[remarkGfm]]}
        rehypePlugins={[[rehypeHeaderAnchor]]}
        components={
          getCustomMDXComponent() as Record<string, React.ElementType>
        }
        skipHtml={true}
      >
        {apiDoc}
      </ReactMarkdown>
    </div>
  );
};
