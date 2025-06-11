/**
 * hello world {#custom-id} -> { text: 'hello world', id: 'custom-id' }
 */
export const extractTextAndId = (
  title?: string,
): [text: string, customId: string] => {
  if (!title) {
    return ['', ''];
  }
  const customIdReg = /\\?{#.*}/;
  if (customIdReg.test(title)) {
    const text = title.replace(customIdReg, '').trimEnd();
    const customId = title.match(customIdReg)?.[0]?.slice(2, -1) || '';
    return [text, customId];
  }
  return [title, ''];
};
