import { renderInlineMarkdown, Tag } from '@theme';
import './SidebarSectionHeader.scss';

export function SidebarSectionHeader({
  sectionHeaderText,
  tag,
}: {
  sectionHeaderText: string;
  tag?: string;
}) {
  return (
    <div className="rp-sidebar-section-header">
      <div className="rp-sidebar-section-header__left">
        <span {...renderInlineMarkdown(sectionHeaderText)}></span>
      </div>
      <div className="rp-sidebar-section-header__right">
        <Tag tag={tag} />
      </div>
    </div>
  );
}
