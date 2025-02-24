/**
 * hello world {#custom-id} -> { text: 'hello world', id: 'custom-id' }
 */
export const extractTextAndId = (title: string) => {
  const customIdReg = /\\?{#.*}/;
  const text = title.replace(customIdReg, '').trimEnd();
  const customId = title.match(customIdReg)?.[0]?.slice(2, -1) || '';
  return [text, customId];
};
