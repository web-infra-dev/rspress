/**
 * Check if a string is a URL or file path
 */
function isUrlOrPath(str: string): boolean {
  return (
    str.startsWith('/') ||
    str.startsWith('./') ||
    str.startsWith('../') ||
    str.startsWith('http://') ||
    str.startsWith('https://')
  );
}

type SvgWrapperProps = {
  icon: string | React.FC<React.SVGProps<SVGSVGElement>>;
} & React.SVGProps<SVGSVGElement>;

/**
 * A wrapper for custom SVG icon.
 * When the user uses a custom SVG, the imported icon can be a string or a React component.
 * - React component: render directly
 * - SVG string (starts with `<svg`): render with dangerouslySetInnerHTML
 * - URL/path: render with `<img>`
 * @internal
 */
export function SvgWrapper({ icon: Icon, ...rest }: SvgWrapperProps) {
  if (!Icon) {
    return null;
  }
  if (typeof Icon === 'string') {
    const { className } = rest;
    // SVG inline string
    if (Icon.trim().startsWith('<svg')) {
      return (
        <span
          className={className}
          dangerouslySetInnerHTML={{ __html: Icon }}
        />
      );
    }
    // URL or file path
    if (isUrlOrPath(Icon)) {
      return <img className={className} src={Icon} alt="" />;
    }
    // Fallback: return null for non-URL strings (emoji/text should be handled elsewhere)
    return null;
  }

  return <Icon {...rest} />;
}
