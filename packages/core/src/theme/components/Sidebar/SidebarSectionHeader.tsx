import { renderInlineMarkdown, Tag } from '@theme';
import './SidebarSectionHeader.scss';
import { PREFIX } from '../../constant';

export function SidebarSectionHeader({
  sectionHeaderText,
  tag,
}: {
  sectionHeaderText: string;
  tag?: string;
}) {
  return (
    <div className={`${PREFIX}sidebar-section-header`}>
      <div className={`${PREFIX}sidebar-section-header__left`}>
        <span {...renderInlineMarkdown(sectionHeaderText)}></span>
      </div>
      <div className={`${PREFIX}sidebar-section-header__right`}>
        <Tag tag={tag} />
      </div>
    </div>
  );
}
