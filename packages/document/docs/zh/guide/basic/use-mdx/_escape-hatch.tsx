import { getCustomMDXComponent } from '@theme';

export default () => {
  const { code: Code, p: P } = getCustomMDXComponent();
  return (
    <P>
      这是一段在 tsx 中的内容，不过可以使用<Code>代码块</Code>样式。
    </P>
  );
};
