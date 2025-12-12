import { DocContent as BasicDocContent } from '@rspress/core/theme-original';
import {
  LlmsContainer,
  LlmsCopyButton,
  LlmsViewOptions,
} from '@rspress/plugin-llms/runtime';

export const DocContent = (props: any) => {
  return <BasicDocContent {...props} />;
};
