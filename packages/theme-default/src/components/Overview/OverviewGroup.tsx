import { Link, renderInlineMarkdown } from '@theme';
import './OverviewGroup.scss';
import type { Header } from '@rspress/shared';
import { H2 } from '../../layout/DocLayout/docComponents/title';

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
      <H2 {...renderInlineMarkdown(group.name)} />
      <div className="rp-overviewGroup rp-not-doc">
        {group.items.map(item => (
          <div className="rp-overviewGroup__item" key={item.link}>
            <div className="rp-overviewGroup__item__title">
              <Link
                href={item.link}
                {...renderInlineMarkdown(item.text)}
              ></Link>
            </div>
            <ul className="rp-overviewGroup__item__content">
              {item.headers?.map(header => (
                <li
                  key={header.id}
                  className="rp-overviewGroup__item__content__item"
                >
                  <Link
                    className="rp-overviewGroup__item__content__item__link"
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
