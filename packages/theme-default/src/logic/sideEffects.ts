import { type Header, inBrowser } from '@rspress/shared';
import { throttle } from 'lodash-es';
import { useEffect } from 'react';
import { useUISwitch } from './useUISwitch';

function getTargetTop(element: HTMLElement, scrollPaddingTop: number) {
  const targetPadding = Number.parseInt(
    window.getComputedStyle(element).paddingTop,
    10,
  );

  const targetTop =
    window.scrollY +
    element.getBoundingClientRect().top -
    scrollPaddingTop -
    targetPadding;

  return Math.round(targetTop);
}

export function scrollToTarget(
  target: HTMLElement,
  isSmooth: boolean,
  scrollPaddingTop: number,
) {
  // Only scroll smoothly in page header anchor
  window.scrollTo({
    left: 0,
    top: getTargetTop(target, scrollPaddingTop),
    ...(isSmooth ? { behavior: 'smooth' } : {}),
  });
}

// Initial scroll position
function scrollTo(
  el: HTMLElement,
  hash: string,
  isSmooth = false,
  scrollPaddingTop: number,
) {
  let target: HTMLElement | null = null;
  try {
    target = el.classList.contains('header-anchor')
      ? el
      : document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch (e) {
    console.warn(e);
  }
  if (target) {
    scrollToTarget(target, isSmooth, scrollPaddingTop);
  }
}

// Control the scroll behavior of the browser when user clicks on a link
export function useBindingWindowScroll() {
  const { scrollPaddingTop } = useUISwitch();

  useEffect(() => {
    window.addEventListener(
      'click',
      e => {
        // Only handle a tag click
        const link = (e.target as Element).closest('a');
        if (!link) {
          return;
        }
        const { origin, hash, target, pathname, search } = link;
        const currentUrl = window.location;
        // only intercept inbound links
        if (hash && target !== '_blank' && origin === currentUrl.origin) {
          // scroll between hash anchors in the same page
          if (
            pathname === currentUrl.pathname &&
            search === currentUrl.search &&
            hash &&
            link.classList.contains('header-anchor')
          ) {
            e.preventDefault();
            history.pushState(null, '', hash);
            // use smooth scroll when clicking on header anchor links
            scrollTo(link, hash, true, scrollPaddingTop);
            // still emit the event so we can listen to it in themes
            window.dispatchEvent(new Event('hashchange'));
          } else {
            window.addEventListener('RspressReloadContent', () => {
              if (location.hash.length > 1) {
                const ele = document.getElementById(location.hash.slice(1))!;
                scrollToTarget(ele, false, scrollPaddingTop);
              }
            });
          }
        }
      },
      { capture: true },
    );
    window.addEventListener('hashchange', e => {
      e.preventDefault();
    });
  }, [scrollPaddingTop]);
}

// Binding the scroll event to the aside element
export function useBindingAsideScroll(headers: Header[]) {
  const { scrollPaddingTop } = useUISwitch();

  function isBottom() {
    return (
      document.documentElement.scrollTop + window.innerHeight >=
      document.documentElement.scrollHeight
    );
  }

  useEffect(() => {
    const aside = document.getElementById('aside-container');
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        '.rspress-doc .header-anchor',
      ),
    ).filter(item => item.parentElement?.tagName !== 'H1');

    if (!aside || !links.length || !headers.length) {
      return;
    }

    let prevActiveLink: null | HTMLAnchorElement = null;

    // Util function to set dom ref after determining the active link
    const activate = (links: HTMLAnchorElement[], index: number) => {
      if (links[index]) {
        const id = links[index].getAttribute('href');
        const currentLink = aside?.querySelector(`a[href="#${id?.slice(1)}"]`);
        if (currentLink) {
          if (prevActiveLink) {
            prevActiveLink.classList.remove('aside-active');
          }
          prevActiveLink = currentLink as HTMLAnchorElement;
          prevActiveLink.classList.add('aside-active');
        }
      }
    };

    const setActiveLink = () => {
      if (isBottom()) {
        activate(links, links.length - 1);
      } else {
        // Compute current index
        for (let i = 0; i < links.length; i++) {
          const currentAnchor = links[i];
          const nextAnchor = links[i + 1];
          const scrollTop = Math.ceil(window.scrollY);
          const currentAnchorTop = getTargetTop(
            currentAnchor.parentElement!,
            scrollPaddingTop,
          );
          if ((i === 0 && scrollTop < currentAnchorTop) || scrollTop === 0) {
            activate(links, 0);
            break;
          }

          if (!nextAnchor) {
            activate(links, i);
            break;
          }

          const nextAnchorTop = getTargetTop(
            nextAnchor.parentElement!,
            scrollPaddingTop,
          );

          if (scrollTop >= currentAnchorTop && scrollTop < nextAnchorTop) {
            activate(links, i);
            break;
          }
        }
      }
    };

    const throttledSetLink = throttle(setActiveLink, 100);

    window.addEventListener('scroll', throttledSetLink);

    setActiveLink();

    return () => {
      if (prevActiveLink) {
        prevActiveLink.classList.remove('aside-active');
      }
      window.removeEventListener('scroll', throttledSetLink);
    };
  }, [scrollPaddingTop, headers.length]);
}

export function useSetup() {
  if (!inBrowser()) {
    return;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useBindingWindowScroll();
}
