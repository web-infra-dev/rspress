import { renderInlineMarkdown, SvgWrapper, Tag } from '@rspress/core/theme';
import './SidebarSectionHeader.scss';

export function SidebarSectionHeader({
  icon,
  sectionHeaderText,
  tag,
}: {
  icon?: string;
  sectionHeaderText: string;
  tag?: string;
}) {
  return (
    <div className="rp-sidebar-section-header">
      <div className="rp-sidebar-section-header__left">
        {icon && (
          <SvgWrapper icon={icon} className="rp-sidebar-section-header__icon" />
        )}
        <span {...renderInlineMarkdown(sectionHeaderText)}></span>
      </div>
      <div className="rp-sidebar-section-header__right">
        <Tag tag={tag} />
      </div>
    </div>
  );
}
