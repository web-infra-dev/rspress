import type {
  MdxJsxAttribute,
  MdxJsxAttributeValueExpression,
  MdxJsxExpressionAttribute,
  MdxJsxFlowElement,
  MdxJsxTextElement,
} from 'mdast-util-mdx-jsx';

export function getNodeAttribute(
  node: MdxJsxFlowElement | MdxJsxTextElement,
  attrName: string,
  attribute?: false,
): string | MdxJsxAttributeValueExpression | null | undefined;
export function getNodeAttribute(
  node: MdxJsxFlowElement | MdxJsxTextElement,
  attrName: string,
  attribute: true,
): MdxJsxAttribute | MdxJsxExpressionAttribute | undefined;
export function getNodeAttribute(
  node: MdxJsxFlowElement | MdxJsxTextElement,
  attrName: string,
  attribute?: boolean,
) {
  const found = node.attributes.find(
    attr => 'name' in attr && attr.name === attrName,
  );
  return attribute ? found : found?.value;
}
