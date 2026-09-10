import { useNav } from '@rspress/core/runtime';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './SlotPreview.module.scss';

type Box = { left: number; top: number; width: number; height: number };
type Marker = { names: string[]; x: number; y: number; box?: Box };
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
        const x = horizontal ? rect.left + rect.width / 2 : rect[edge];
        const nav = element.closest('.rp-nav');
        const y = horizontal
          ? rect[edge]
          : (nav?.getBoundingClientRect().top ?? rect.top) + 8;
        if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) return;
        // Do not show offscreen sidebar/outline content through its scroll container.
        const aside = element.closest('aside');
        if (aside) {
          const clip = aside.getBoundingClientRect();
          if (y < clip.top || y > clip.bottom) return;
        }
        const point = {
          x: Math.max(8, Math.min(innerWidth - 8, x)),
          y: Math.max(8, Math.min(innerHeight - 8, y)),
        };
        const existing = next.find(
          marker =>
            Math.abs(marker.x - point.x) < 2 &&
            Math.abs(marker.y - point.y) < 2,
        );
        if (existing) existing.names.push(name);
        else next.push({ names: [name], ...point });
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
      if (innerWidth >= 1280) {
        // Keep labels readable without moving any of the underlying page content.
        const placed: Box[] = [];
        const toolbar = document.querySelector('[data-slot-preview-toolbar]');
        if (toolbar) placed.push(toolbar.getBoundingClientRect());
        next.sort((a, b) => a.y - b.y || a.x - b.x);
        for (const marker of next) {
          const width = Math.min(
            128,
            Math.max(...marker.names.map(name => name.length)) * 5.5 + 10,
          );
          const height = marker.names.length * 12 + 6;
          const box = {
            left: Math.max(
              8,
              Math.min(innerWidth - width - 8, marker.x - width / 2),
            ),
            top: Math.min(innerHeight - height - 8, marker.y),
            width,
            height,
          };
          for (let attempt = 0; attempt <= next.length; attempt++) {
            const overlap = placed.find(
              other =>
                box.left < other.left + other.width + 4 &&
                box.left + box.width + 4 > other.left &&
                box.top < other.top + other.height + 4 &&
                box.top + box.height + 4 > other.top,
            );
            if (!overlap) break;
            box.top = overlap.top + overlap.height + 4;
            if (box.top + height > innerHeight - 8)
              box.top = Math.max(8, overlap.top - height - 4);
          }
          marker.box = box;
          placed.push(box);
        }
      }
      setMarkers(next);
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
      <svg className={styles.guides} aria-hidden="true">
        {markers
          .filter(marker => marker.box)
          .map(({ names, x, y, box }) => (
            <line key={names.join(' ')} x1={x} y1={y} x2={x} y2={box!.top} />
          ))}
      </svg>
      {markers.map(({ names, x, y, box }) => (
        <button
          key={names.join(' ')}
          type="button"
          className={styles.marker}
          data-slot-preview={names.join(' ')}
          data-align={
            x < 180 ? 'start' : x > innerWidth - 180 ? 'end' : undefined
          }
          data-above={y > innerHeight - 100}
          style={box ?? { left: x - 7, top: y - 5 }}
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
