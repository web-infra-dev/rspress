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
      style={{
        paddingLeft: depth === 0 ? '12px' : `calc(12px * ${depth} + 12px)`,
      }}
    />
  );
}
