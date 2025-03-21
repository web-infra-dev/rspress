export type SidebarDividerProps = {
  depth: number;
  dividerType: 'dashed' | 'solid';
};

export function SidebarDivider(props: SidebarDividerProps) {
  const { depth, dividerType } = props;
  const borderTypeStyle =
    dividerType === 'dashed' ? 'rp-border-dashed' : 'rp-border-solid';

  return (
    <div
      className={`${borderTypeStyle} rp-border-t rp-border-divider-light rp-my-3`}
      style={{ marginLeft: depth === 0 ? 0 : '18px' }}
    />
  );
}
