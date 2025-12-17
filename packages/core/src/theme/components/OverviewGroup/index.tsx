import { Link, renderInlineMarkdown } from '@theme';
import './index.scss';
import type { Header } from '@rspress/core';
import { FallbackHeading, SvgWrapper } from '@theme';
import IconPlugin from './icons/plugin.svg';

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
  // Filter out items that have no headers and no custom items
  const itemsWithContent = group.items.filter(
    item =>
      (item.headers && item.headers.length > 0) ||
      (item.items && item.items.length > 0),
  );

  // If no items have content, don't render the group at all
  if (itemsWithContent.length === 0) {
    return null;
  }

  return (
    <>
      <FallbackHeading level={2} title={group.name} />
      <div className="rp-overview-group rp-not-doc">
        {itemsWithContent.map(item => (
          <div className="rp-overview-group__item" key={item.link}>
            <div className="rp-overview-group__item__title">
              {item.link ? (
                <Link
                  href={item.link}
                  {...renderInlineMarkdown(item.text)}
                ></Link>
              ) : (
                <span {...renderInlineMarkdown(item.text)} />
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
      </div>
    </>
  );
};
