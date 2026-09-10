import { useNav } from '@rspress/core/runtime';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './SlotPreview.module.scss';

type Box = { left: number; top: number; width: number; height: number };
type Marker = { names: string[]; box: Box; navigation: boolean };
type Edge = 'top' | 'bottom' | 'left' | 'right';

/** Read existing layout geometry; previewing must not add content to any slot. */
export function SlotPreviewOverlay() {
  const navPositions = useNav()
    .map(item => item.position ?? 'right')
    .join(',');
  const [markers, setMarkers] = useState<Marker[]>([]);

  useEffect(() => {
    const positions = navPositions ? navPositions.split(',') : [];
    let frame = 0;
    const update = () => {
      frame = 0;
      const next: Marker[] = [];
      const add = (name: string, element: Element | null, edge: Edge) => {
        if (
          !element ||
          !element.getClientRects().length ||
          getComputedStyle(element).visibility === 'hidden'
        )
          return;
        const rect = element.getBoundingClientRect();
        if (!rect.width && !rect.height) return;
        const horizontal = edge === 'top' || edge === 'bottom';
        const nav = element.closest('.rp-nav');
        const navigation = !!nav && (!horizontal || name === 'navTitle');
        const x = horizontal ? rect.left + rect.width / 2 : rect[edge];
        const y = horizontal ? rect[edge] : rect.top + rect.height / 2;
        if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) return;
        const aside = element.closest('aside');
        if (aside) {
          const clip = aside.getBoundingClientRect();
          if (y < clip.top || y > clip.bottom) return;
        }
        const navRect = nav?.getBoundingClientRect();
        // A slot without content has no area of its own. Show a translucent
        // strip along its insertion boundary, spanning the containing region.
        const height = navigation
          ? Math.min(44, navRect!.height - 20)
          : ['top', 'beforeNav', 'afterNav', 'bottom'].includes(name)
            ? 6
            : 28;
        const width = navigation
          ? name === 'navTitle'
            ? rect.width
            : 112
          : rect.width;
        const box = {
          left: Math.max(4, navigation ? x - width / 2 : rect.left),
          top: navigation
            ? navRect!.top + (navRect!.height - height) / 2
            : Math.max(0, edge === 'top' ? y - height : y),
          width: Math.min(width, innerWidth - 8),
          height,
        };
        box.left = Math.min(box.left, innerWidth - box.width - 4);
        // Coincident insertion boundaries share one region instead of stacking
        // several independent labels over the same location.
        const existing = next.find(
          marker =>
            marker.navigation === navigation &&
            Math.abs(
              marker.box.left +
                marker.box.width / 2 -
                (box.left + box.width / 2),
            ) < 2 &&
            Math.abs(marker.box.top - box.top) < 2 &&
            (navigation || Math.abs(marker.box.width - box.width) < 2),
        );
        if (existing) existing.names.push(name);
        else next.push({ names: [name], box, navigation });
      };
      const at = (name: string, selector: string, edge: Edge) =>
        add(name, document.querySelector(selector), edge);

      at('top', 'body', 'top');
      at('beforeNav', '.rp-banner, .rp-nav', 'top');
      at('afterNav', '.rp-nav', 'bottom');
      at('beforeNavTitle', '.rp-nav__left', 'left');
      at('navTitle', '.rp-nav__title', 'top');
      at('afterNavTitle', '.rp-nav__left', 'right');
      at('beforeNavMenu', '.rp-nav__right', 'left');
      at('afterNavMenu', '.rp-nav__right', 'right');

      const screen = document.querySelector('.rp-nav-screen');
      if (screen) {
        const items = screen.querySelectorAll(
          '.rp-nav-screen__container > .rp-nav-screen-menu-item',
        );
        for (const position of ['left', 'right'] as const) {
          const first = positions.findIndex(item => item === position);
          const last = positions.findLastIndex(item => item === position);
          const label = position === 'left' ? 'Left' : 'Right';
          const fallback =
            position === 'left' ? items[0] : items[positions.length - 1];
          const edge = position === 'left' ? 'top' : 'bottom';
          add(
            `before${label}NavItems`,
            first < 0 ? fallback : items[first],
            first < 0 ? edge : 'top',
          );
          const lastItem = last < 0 ? fallback : items[last];
          const group = lastItem?.nextElementSibling;
          const after =
            (last >= 0 || position === 'right') &&
            group?.matches('.rp-nav-screen-menu-item__group')
              ? group
              : lastItem;
          add(`after${label}NavItems`, after, last < 0 ? edge : 'bottom');
        }
      } else if (matchMedia('(min-width: 769px)').matches) {
        for (const position of ['left', 'right'] as const) {
          const menu = document.querySelector(`.rp-nav-menu--${position}`);
          const label = position === 'left' ? 'Left' : 'Right';
          const fallback = document.querySelector(
            position === 'left'
              ? '.rp-nav__title'
              : '.rp-nav__right > .rp-nav__others',
          );
          const edge = position === 'left' ? 'right' : 'left';
          add(`before${label}NavItems`, menu ?? fallback, menu ? 'left' : edge);
          add(`after${label}NavItems`, menu ?? fallback, menu ? 'right' : edge);
        }
      }

      if (!screen) {
        for (const [name, selector] of [
          ['Doc', '.rp-doc-layout__container'],
          ['DocFooter', '.rp-doc-footer'],
          ['Outline', '.rp-outline'],
          ['Hero', '.rp-home-hero'],
          ['Features', '.rp-home-feature'],
        ]) {
          at(`before${name}`, selector, 'top');
          at(`after${name}`, selector, 'bottom');
        }
        at(
          'beforeDocContent',
          '.rp-doc-layout__doc-container > :first-child',
          'top',
        );
        at('afterDocContent', '.rspress-doc', 'bottom');
        at('beforeSidebar', '.rp-doc-layout__sidebar > :first-child', 'top');
        at('afterSidebar', '.rp-doc-layout__sidebar > :last-child', 'bottom');
        at('bottom', 'body', 'bottom');
      }
      // Keep navigation regions on the navbar itself. Divide overlapping areas
      // at the midpoint between their boundaries; never move labels elsewhere.
      const navMarkers = next
        .filter(marker => marker.navigation)
        .sort(
          (a, b) => a.box.left + a.box.width / 2 - b.box.left - b.box.width / 2,
        );
      const centers = navMarkers.map(({ box }) => box.left + box.width / 2);
      navMarkers.forEach(({ box }, index) => {
        const left = index ? (centers[index - 1] + centers[index]) / 2 + 2 : 4;
        const right =
          index < centers.length - 1
            ? (centers[index] + centers[index + 1]) / 2 - 2
            : innerWidth - 4;
        const end = Math.min(box.left + box.width, right);
        box.left = Math.max(box.left, left);
        box.width = Math.max(4, end - box.left);
      });
      const strips = next
        .filter(marker => !marker.navigation)
        .sort((a, b) => a.box.top - b.box.top);
      for (let index = 0; index < strips.length; index++) {
        const box = strips[index].box;
        const following = strips
          .slice(index + 1)
          .find(
            ({ box: other }) =>
              Math.abs(box.left - other.left) < 2 &&
              Math.abs(box.width - other.width) < 2,
          )?.box;
        if (following && box.top + box.height > following.top) {
          const boundary = (box.top + box.height + following.top) / 2;
          const bottom = following.top + following.height;
          box.height = Math.max(2, boundary - box.top - 1);
          following.top = boundary + 1;
          following.height = Math.max(2, bottom - following.top);
        }
      }
      const hamburger = document.querySelector('.rp-nav-hamburger__sm');
      if (hamburger?.getClientRects().length) {
        const control = hamburger.getBoundingClientRect();
        for (const { box } of navMarkers) {
          if (box.left < control.right && box.left + box.width > control.left) {
            const leftSpace = control.left - box.left;
            const rightSpace = box.left + box.width - control.right;
            if (leftSpace >= rightSpace) box.width = Math.max(0, leftSpace - 4);
            else {
              box.left = control.right + 4;
              box.width = Math.max(0, rightSpace - 4);
            }
          }
        }
      }
      setMarkers(next.filter(({ box }) => box.width > 0));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    const mutations = new MutationObserver(records => {
      if (
        records.some(
          record =>
            !(
              record.target instanceof Element &&
              record.target.closest(`.${styles.layer}`)
            ),
        )
      )
        schedule();
    });
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    document.addEventListener('transitionend', schedule, true);
    document.addEventListener('animationend', schedule, true);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('transitionend', schedule, true);
      document.removeEventListener('animationend', schedule, true);
    };
  }, [navPositions]);

  return createPortal(
    <div className={styles.layer}>
      {markers.map(({ names, box }) => (
        <button
          key={names.join(' ')}
          type="button"
          className={styles.marker}
          data-slot-preview={names.join(' ')}
          data-align={
            box.left < 180
              ? 'start'
              : box.left + box.width > innerWidth - 180
                ? 'end'
                : undefined
          }
          data-above={box.top > innerHeight - 100}
          data-readable={
            box.width >= 48 &&
            box.height >=
              names.reduce(
                (lines, name) =>
                  lines +
                  Math.ceil(
                    name.length /
                      Math.max(1, Math.floor((box.width - 8) / 5.5)),
                  ),
                0,
              ) *
                12 +
                8
          }
          style={box}
          aria-label={names.join(', ')}
        >
          <span className={styles.label} aria-hidden="true">
            {names.map(name => (
              <span key={name}>{name}</span>
            ))}
          </span>
        </button>
      ))}
    </div>,
    document.body,
  );
}
