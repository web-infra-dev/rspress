import { getCustomMDXComponent } from '@rspress/core/theme';

export default () => {
  const { p: P, code: Code } = getCustomMDXComponent();
  return (
    <P className="rp-doc">
      This is content in tsx, but the styles are the same as in the
      documentation, such as <Code>@rspress/core</Code>. However, this text with
      className="rp-not-doc"
      <Code className="rp-not-doc">@rspress/core</Code> will not take effect
    </P>
  );
};
