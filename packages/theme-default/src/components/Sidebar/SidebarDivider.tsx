import './SidebarDivider.scss';

export type SidebarDividerProps = {
  depth: number;
  dividerType: 'dashed' | 'solid';
};

export function SidebarDivider(props: SidebarDividerProps) {
  const { depth, dividerType } = props;
  const className =
    dividerType === 'dashed'
      ? 'rp-sidebar-divider--dashed'
      : 'rp-sidebar-divider';

  return (
    <div
      className={className}
      style={{
        paddingLeft: depth === 0 ? '12px' : `calc(12px * ${depth} + 12px)`,
      }}
    />
  );
}
