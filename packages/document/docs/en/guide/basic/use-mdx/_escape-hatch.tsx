import { getCustomMDXComponent } from '@theme';

export default () => {
  const { code: Code, p: P } = getCustomMDXComponent();
  return (
    <P>
      This is content in tsx, but you can use <Code>code block</Code> styles.
    </P>
  );
};
