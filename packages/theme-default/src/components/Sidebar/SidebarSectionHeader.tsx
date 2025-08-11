import { Tag } from '@theme';
import { renderInlineMarkdown } from '../../logic/utils';
import { sectionHeader } from './SidebarSectionHeader.module.scss';

export function SidebarSectionHeader({
  sectionHeaderText,
  tag,
}: {
  sectionHeaderText: string;
  tag?: string;
}) {
  return (
    <div className={`rspress-sidebar-section-header ${sectionHeader}`}>
      <span {...renderInlineMarkdown(sectionHeaderText)}></span>
      <Tag tag={tag} />
    </div>
  );
}
