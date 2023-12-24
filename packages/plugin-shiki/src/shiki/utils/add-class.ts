export function addClass(
  code: string,
  classes: string | string[],
  tag?: string,
): string {
  const classRE = new RegExp(`<${tag ?? 'w+'}[^>]*class="([\\w+-:;\\/* ]*)"`);
  // eslint-disable-next-line no-param-reassign
  classes = Array.isArray(classes) ? classes : [classes];

  return code.replace(classRE, (match, previousClasses) => {
    return match.replace(previousClasses, `${previousClasses} ${classes}`);
  });
}
