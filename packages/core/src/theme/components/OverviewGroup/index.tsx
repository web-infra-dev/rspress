import { Link, renderInlineMarkdown } from '@theme';
import './index.scss';
import type { Header } from '@rspress/core';
import { FallbackHeading, SvgWrapper } from '@theme';
import { useMemo } from 'react';
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

        {/* Render items without content in a grid layout */}
        {itemsWithoutContent.length > 0 && (
          <div className="rp-overview-group__grid">
            {itemsWithoutContent.map(item => (
              <div className="rp-overview-group__grid-item" key={item.link}>
                {item.link ? (
                  <Link
                    href={item.link}
                    className="rp-overview-group__grid-item__link"
                    {...renderInlineMarkdown(item.text)}
                  ></Link>
                ) : (
                  <span
                    className="rp-overview-group__grid-item__text"
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
