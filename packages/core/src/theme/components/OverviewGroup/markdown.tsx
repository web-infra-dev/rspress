import type { Header } from '@rspress/core';
import { routePathToMdPath } from '@rspress/core/runtime';

export interface GroupItem {
  text: string;
  link: string;
  headers?: Header[];
  items?: { text: string; link: string }[];
}

export interface Group {
  name: string;
  items: GroupItem[];
}

export function OverviewGroupMarkdown({ group }: { group: Group }) {
  const lines: string[] = [];

  if (group.name) {
    lines.push(`## ${group.name}`);
    lines.push('');
  }

  for (const item of group.items) {
    const itemTitle = item.link
      ? `[${item.text}](${routePathToMdPath(item.link)})`
      : `**${item.text}**`;
    lines.push(`### ${itemTitle}`);
    lines.push('');

    // Render headers as a list
    if (item.headers && item.headers.length > 0) {
      for (const header of item.headers) {
        const headerLink = item.link
          ? `[${header.text}](${routePathToMdPath(item.link)}#${header.id})`
          : header.text;
        lines.push(`- ${headerLink}`);
      }
      lines.push('');
    }

    // Render custom items as a list
    if (item.items && item.items.length > 0) {
      for (const subItem of item.items) {
        const subItemLink = subItem.link
          ? `[${subItem.text}](${routePathToMdPath(subItem.link)})`
          : subItem.text;
        lines.push(`- ${subItemLink}`);
      }
      lines.push('');
    }
  }

  return <>{lines.join('\n')}</>;
}
