import { Link, renderInlineMarkdown } from '@theme';
import './OverviewGroup.scss';
import type { Header } from '@rspress/core';
import { SvgWrapper } from '@theme';
import { PREFIX } from '../../constant';
import { FallbackHeading } from '../DocContent/FallbackHeading';
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
  return (
    <>
      <FallbackHeading level={2} title={group.name} />
      <div className={`${PREFIX}overview-group ${PREFIX}not-doc`}>
        {group.items.map(item => (
          <div className={`${PREFIX}overview-group__item`} key={item.link}>
            <div className={`${PREFIX}overview-group__item__title`}>
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
                className={`${PREFIX}overview-group__item__title__icon`}
              />
            </div>
            <ul className={`${PREFIX}overview-group__item__content`}>
              {item.headers?.map(header => (
                <li
                  key={header.id}
                  className={`${PREFIX}overview-group__item__content__item`}
                >
                  <Link
                    className={`${PREFIX}overview-group__item__content__item__link`}
                    href={`${item.link}#${header.id}`}
                    {...renderInlineMarkdown(header.text)}
                  ></Link>
                </li>
              ))}
              {item.items?.map(({ link, text }) => {
                return (
                  <li
                    key={link}
                    className={`${PREFIX}overview-group__item__content__item`}
                  >
                    <Link
                      className={`${PREFIX}overview-group__item__content__item__link`}
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
