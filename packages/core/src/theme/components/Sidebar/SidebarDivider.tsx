import './SidebarDivider.scss';
import { PREFIX } from '../../constant';

export type SidebarDividerProps = {
  depth: number;
  dividerType: 'dashed' | 'solid';
};

export function SidebarDivider(props: SidebarDividerProps) {
  const { depth, dividerType } = props;
  const className =
    dividerType === 'dashed'
      ? `${PREFIX}sidebar-divider--dashed`
      : `${PREFIX}sidebar-divider`;

  return (
    <div
      className={className}
      style={{
        paddingLeft: depth === 0 ? '12px' : `calc(12px * ${depth} + 12px)`,
      }}
    />
  );
}
