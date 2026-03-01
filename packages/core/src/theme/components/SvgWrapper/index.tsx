import { normalizeImagePath } from '@rspress/core/runtime';
import { renderHtmlOrText } from '@theme';

/**
 * Check if a string is a URL or file path
 */
function isUrlOrPath(str: string): boolean {
  return (
    str.startsWith('/') ||
    str.startsWith('./') ||
    str.startsWith('../') ||
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('data:')
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
 * - Other strings (emoji/text/HTML): render with renderHtmlOrText
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
      return (
        <img className={className} src={normalizeImagePath(Icon)} alt="" />
      );
    }
    // Fallback: emoji/text/HTML
    return <span className={className} {...renderHtmlOrText(Icon)} />;
  }

  return <Icon {...rest} />;
}
