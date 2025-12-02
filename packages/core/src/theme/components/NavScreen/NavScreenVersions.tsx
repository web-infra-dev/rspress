import { useState } from 'react';
import { useVersionsMenu } from '../Nav/hooks';
import './NavScreenVersions.scss';
import { useI18n } from '@rspress/core/runtime';
import { Link } from '@theme';
import clsx from 'clsx';
import { PREFIX } from '../../constant';
import { SvgDown } from './NavScreenMenuItem';

export function NavScreenVersions() {
  const { items, activeValue } = useVersionsMenu();
  const [isOpen, setIsOpen] = useState(false);
  const t = useI18n();

  return items.length > 1 ? (
    <>
      <div
        className={`${PREFIX}nav-screen-versions`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`${PREFIX}nav-screen-versions__left`}>
          {t('versionsText')}
        </div>
        <div className={`${PREFIX}nav-screen-versions__right`}>
          {activeValue}
          <SvgDown
            className={clsx(`${PREFIX}nav-screen-versions__icon`, {
              [`${PREFIX}nav-screen-versions__icon--open`]: isOpen,
            })}
          />
        </div>
      </div>
      <div
        className={clsx(
          `${PREFIX}nav-screen-versions-group`,
          isOpen && `${PREFIX}nav-screen-versions-group--open`,
        )}
      >
        {items.map(item => (
          <Link
            key={item.text}
            href={item.link}
            className={`${PREFIX}nav-screen-versions-group__item`}
          >
            {item.text}
          </Link>
        ))}
      </div>
    </>
  ) : null;
}
