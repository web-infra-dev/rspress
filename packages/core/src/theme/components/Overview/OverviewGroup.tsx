import { Link, renderInlineMarkdown } from '@theme';
import './OverviewGroup.scss';
import type { Header } from '@rspress/core';
import { FallbackHeading } from '../DocContent/FallbackHeading';
import { SvgWrapper } from '../SvgWrapper';
import IconPlugin from './icons/plugin.svg';

export interface GroupItem {
  text: string;
  link: string;
  headers?: Header[];
}

export interface Group {
  name: string;
  items: GroupItem[];
}

export const OverviewGroup = ({ group }: { group: Group }) => {
  return (
    <>
      <FallbackHeading level={2} title={group.name} />
      <div className="rp-overview-group rp-not-doc">
        {group.items.map(item => (
          <div className="rp-overview-group__item" key={item.link}>
            <div className="rp-overview-group__item__title">
              <Link
                href={item.link}
                {...renderInlineMarkdown(item.text)}
              ></Link>
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
            </ul>
          </div>
        ))}
      </div>
    </>
  );
};
