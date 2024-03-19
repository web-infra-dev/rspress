export type SidebarDividerProps = {
  depth: number;
  dividerType: 'dashed' | 'solid';
};

export function SidebarDivider(props: SidebarDividerProps) {
  const { depth, dividerType } = props;
  const borderTypeStyle =
    dividerType === 'dashed' ? 'border-dashed' : 'border-solid';

  return (
    <div
      className={`${borderTypeStyle} border-t border-divider-light my-3`}
      style={{ marginLeft: depth === 0 ? 0 : '18px' }}
    />
  );
}
