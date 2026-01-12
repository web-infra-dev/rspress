import { getCustomMDXComponent } from '@rspress/core/theme';

export default () => {
  const { p: P, code: Code } = getCustomMDXComponent();
  return (
    <P className="rp-doc">
      这是一段在 tsx 中的内容，不过样式和在文档中的样式一样，比如
      <Code>@rspress/core</Code>。 但是 含有 className="rp-not-doc" 的这段文字
      <Code className="rp-not-doc">@rspress/core</Code> 不会生效
    </P>
  );
};
