import { useState } from 'react';
import { useLangsMenu } from '../Nav/hooks';
import './NavScreenLangs.scss';
import { Link } from '@theme';
import clsx from 'clsx';
import { SvgDown } from './NavScreenMenuItem';

export function NavScreenLangs() {
  const { items, activeValue } = useLangsMenu();
  const [isOpen, setIsOpen] = useState(false);

  return items.length > 1 ? (
    <>
      <div className="rp-nav-screen-langs" onClick={() => setIsOpen(!isOpen)}>
        <div className="rp-nav-screen-langs__left">Languages</div>
        <div className="rp-nav-screen-langs__right">
          {activeValue}
          <SvgDown
            className={clsx('rp-nav-screen-langs__icon', {
              'rp-nav-screen-langs__icon--open': isOpen,
            })}
          />
        </div>
      </div>
      <div
        className={clsx(
          'rp-nav-screen-langs-group',
          isOpen && 'rp-nav-screen-langs-group--open',
        )}
      >
        {items.map(item => (
          <Link
            key={item.text}
            href={item.link}
            className={`rp-nav-screen-langs-group__item`}
          >
            {item.text}
          </Link>
        ))}
      </div>
    </>
  ) : null;
}
