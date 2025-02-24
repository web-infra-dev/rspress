import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';

export const getNodeAttribute = (
  node: MdxJsxFlowElement | MdxJsxTextElement,
  attrName: string,
) => {
  return node.attributes.find(attr => 'name' in attr && attr.name === attrName)
    ?.value;
};
