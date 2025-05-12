import type { Root } from 'mdast';
import type { Plugin } from 'unified';

interface RemarkPluginProps {
  foo?: boolean;
}

/**
 * remark plugin to transform code to demo
 */
export const remarkPlugin: Plugin<[RemarkPluginProps], Root> = ({ foo }) => {
  return (_tree, _vfile) => {
    console.log({ foo });
    // visit(tree, 'mdxJsxFlowElement', node => {});
  };
};
