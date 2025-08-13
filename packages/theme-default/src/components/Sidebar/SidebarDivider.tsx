import { divider, dividerDashed } from './SidebarDivider.module.scss';

export type SidebarDividerProps = {
  depth: number;
  dividerType: 'dashed' | 'solid';
};

export function SidebarDivider(props: SidebarDividerProps) {
  const { depth, dividerType } = props;
  const borderTypeClassName =
    dividerType === 'dashed' ? dividerDashed : divider;

  return (
    <div
      className={`${borderTypeClassName}`}
      // style={{ marginLeft: depth === 0 ? 0 : '18px' }}
    />
  );
}
