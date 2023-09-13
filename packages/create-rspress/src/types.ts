import type { PromptObject } from 'prompts';

export interface CustomPromptObject extends PromptObject {
  value?: any;
  formatFn?: (...data: any) => any;
}
