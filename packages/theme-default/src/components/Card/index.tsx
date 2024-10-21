interface CardProps {
  /**
   * The content to display inside the card. Can be a string or React nodes.
   */
  children: React.ReactNode;
  /**
   * The title of the card.
   */
  title?: React.ReactNode;
  /**
   * The icon of the card.
   */
  icon?: React.ReactNode;
  /**
   * The style of the card.
   */
  style?: React.CSSProperties;
  /**
   * The content to display inside the card.
   */
  text?: string;
}

export function Card({ children, title, icon, style, text }: CardProps) {
  const content = children || text;

  return (
    <div className="border border-gray-400 rounded-lg p-6" style={style}>
      <p className="flex items-center gap-2 mb-4">
        {icon && <div>{icon}</div>}
        {title && <span className="text-2xl font-bold">{title}</span>}
      </p>
      <div className="text-base overflow-auto">{content}</div>
    </div>
  );
}
