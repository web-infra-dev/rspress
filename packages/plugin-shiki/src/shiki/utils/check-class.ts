export const checkClass = (code: string, className: string | string[]) => {
  const classes = Array.isArray(className) ? className.join('') : className;

  return code.search(classes) !== -1;
};
