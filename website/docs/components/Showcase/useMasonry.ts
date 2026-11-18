import { useLayoutEffect, useRef } from 'react';

export function useMasonry() {
  const galleryRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) {
      return;
    }

    const cards = Array.from(gallery.children) as HTMLLIElement[];
    let frame = 0;

    const layout = () => {
      const style = getComputedStyle(gallery);
      const columns = Number(style.getPropertyValue('--showcase-columns'));
      const gap = Number.parseFloat(style.columnGap);
      const width = (gallery.clientWidth - gap * (columns - 1)) / columns;
      const heights = Array<number>(columns).fill(0);

      // Measure at the final column width, including wrapped titles and borders.
      for (const card of cards) {
        card.style.width = `${width}px`;
      }
      gallery.dataset.masonry = 'true';
      const cardHeights = cards.map(
        card => card.getBoundingClientRect().height,
      );

      cards.forEach((card, index) => {
        const column = heights.indexOf(Math.min(...heights));
        card.style.left = `${column * (width + gap)}px`;
        card.style.top = `${heights[column]}px`;
        heights[column] += cardHeights[index] + gap;
      });

      gallery.style.height = `${Math.max(...heights) - gap}px`;
    };

    layout();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    });
    observer.observe(gallery);
    // Reflow when fonts, title wrapping, or image dimensions change as well.
    cards.forEach(card => observer.observe(card));

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      delete gallery.dataset.masonry;
      gallery.style.removeProperty('height');
      for (const card of cards) {
        card.style.removeProperty('width');
        card.style.removeProperty('left');
        card.style.removeProperty('top');
      }
    };
  }, []);

  return galleryRef;
}
