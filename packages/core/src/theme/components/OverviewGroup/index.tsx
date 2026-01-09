import { Link, renderInlineMarkdown } from '@theme';
import './index.scss';
import type { Header } from '@rspress/core';
import { routePathToMdPath } from '@rspress/core/runtime';
import { FallbackHeading, SvgWrapper } from '@theme';
import { useMemo } from 'react';
import IconPlugin from './icons/plugin.svg';

function OverviewGroupMarkdown({ group }: { group: Group }) {
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

export interface GroupItem {
  text: string;
  link: string;
  headers?: Header[];

  // For customization
  items?: { text: string; link: string }[];
}

export interface Group {
  name: string;
  items: GroupItem[];
}

export const OverviewGroup = ({ group }: { group: Group }) => {
  if (process.env.__SSR_MD__) {
    return <OverviewGroupMarkdown group={group} />;
  }

  const { itemsWithContent, itemsWithoutContent } = useMemo(() => {
    // Separate items into those with content and those without
    const itemsWithContent = group.items.filter(
      item =>
        (item.headers && item.headers.length > 0) ||
        (item.items && item.items.length > 0),
    );
    const itemsWithoutContent = group.items.filter(
      item =>
        !(item.headers && item.headers.length > 0) &&
        !(item.items && item.items.length > 0),
    );

    return { itemsWithContent, itemsWithoutContent };
  }, [group]);

  return (
    <>
      <FallbackHeading level={2} title={group.name} />
      <div className="rp-overview-group rp-not-doc">
        {/* Render items with content in the standard split layout */}
        {itemsWithContent.map(item => (
          <div className="rp-overview-group__item" key={item.link}>
            <div className="rp-overview-group__item__title">
              {item.link ? (
                <Link
                  href={item.link}
                  className="rp-overview-group__item__title__link"
                  {...renderInlineMarkdown(item.text)}
                ></Link>
              ) : (
                <span
                  className="rp-overview-group__item__title__text"
                  {...renderInlineMarkdown(item.text)}
                />
              )}
              <SvgWrapper
                icon={IconPlugin}
                className="rp-overview-group__item__title__icon"
              />
            </div>
            <ul className="rp-overview-group__item__content">
              {item.headers?.map(header => (
                <li
                  key={header.id}
                  className="rp-overview-group__item__content__item"
                >
                  <Link
                    className="rp-overview-group__item__content__item__link"
                    href={`${item.link}#${header.id}`}
                    {...renderInlineMarkdown(header.text)}
                  ></Link>
                </li>
              ))}
              {item.items?.map(({ link, text }) => {
                return (
                  <li
                    key={link}
                    className="rp-overview-group__item__content__item"
                  >
                    <Link
                      className="rp-overview-group__item__content__item__link"
                      href={link}
                      {...renderInlineMarkdown(text)}
                    ></Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Render items without content in a grid layout */}
        {itemsWithoutContent.length > 0 && (
          <div className="rp-overview-group__grid">
            {itemsWithoutContent.map(item => (
              <div
                className="rp-overview-group__grid-item rp-overview-group__item__title"
                key={item.link}
              >
                {item.link ? (
                  <Link
                    href={item.link}
                    className="rp-overview-group__item__title__link"
                    {...renderInlineMarkdown(item.text)}
                  ></Link>
                ) : (
                  <span
                    className="rp-overview-group__item__title__text"
                    {...renderInlineMarkdown(item.text)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
