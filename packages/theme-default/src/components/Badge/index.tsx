import * as styles from './index.module.scss';

interface BadgeProps {
  /**
   * The content to display inside the badge. Can be a string or React nodes.
   */
  children?: React.ReactNode;
  /**
   * The type of badge, which determines its color and style.
   * @default 'tip'
   */
  type?: 'tip' | 'info' | 'warning' | 'danger';
  /**
   * The text content to display inside the badge (for backwards compatibility).
   */
  text?: string;
  /**
   * Whether to display the badge with an outline style.
   * @default false
   */
  outline?: boolean;
}

/**
 * A component that renders a styled badge with custom content.
 *
 * The Badge component displays a small, inline element with customizable content and appearance.
 * It's useful for highlighting status, categories, or other short pieces of information.
 *
 * @param {BadgeProps} props - The properties for the Badge component.
 * @returns {JSX.Element} A span element representing the badge.
 *
 * @example
 * Using children:
 * <Badge type="info">New</Badge>
 * <Badge type="warning" outline>Experimental</Badge>
 * <Badge type="danger">Deprecated</Badge>
 * <Badge type="tip" outline><strong>Pro Tip:</strong> Use custom elements</Badge>
 *
 * Using text prop:
 * <Badge text="New" type="info" />
 * <Badge text="Experimental" type="warning" outline />
 * <Badge text="Deprecated" type="danger" />
 */
export function Badge({
  children,
  type = 'tip',
  text,
  outline = false,
}: BadgeProps) {
  const content = children || text;

  return (
    <span
      className={`rp-inline-flex rp-items-center rp-justify-center rp-rounded-full rp-border rp-border-solid ${
        outline ? 'rp-border-current' : 'rp-border-transparent'
      } rp-font-semibold rp-align-middle rp-px-2.5 rp-h-6 rp-gap-1 rp-text-xs ${styles.badge} ${styles[type]} ${
        outline ? styles.outline : ''
      }`}
    >
      {content}
    </span>
  );
}
