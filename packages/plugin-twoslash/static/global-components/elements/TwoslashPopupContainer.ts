import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
} from '@floating-ui/dom';
import TwoslashPopupArrow from './TwoslashPopupArrow';
import TwoslashPopupPortal from './TwoslashPopupPortal';
import TwoslashPopupTrigger from './TwoslashPopupTrigger';

class TwoslashPopupContainer extends HTMLElement {
  static NAME = 'twoslash-popup-container' as const;

  #clone?: {
    element: HTMLElement;
    cleanup: () => void;
  };

  connectedCallback() {
    const trigger = this.parentElement;
    if (trigger?.tagName.toLowerCase() !== TwoslashPopupTrigger.NAME) {
      // Do nothing if the parent element is not a trigger, as this can also be triggered when cloneNode is called.
      return;
    }

    // Clone it to avoid breaking React's rendering tree.
    const element = this.cloneNode(true) as TwoslashPopupContainer;
    const cleanups = [
      this.#registerUpdatePosition(trigger, element),
      this.#registerPopupEvent(trigger, element),
    ];

    this.#clone = {
      element,
      cleanup: () => cleanups.forEach(cleanup => cleanup()),
    };
    TwoslashPopupPortal.instance.append(this.#clone.element);

    // Mark it as initialized to differentiate between the original and the clone.
    this.#clone.element.dataset.initialized = 'true';
  }

  disconnectedCallback() {
    this.#clone?.cleanup();
    this.#clone?.element.remove();
  }

  findArrow(): TwoslashPopupArrow {
    const arrowElement = this.querySelector(TwoslashPopupArrow.NAME);
    if (arrowElement) return arrowElement as TwoslashPopupArrow;
    throw new Error(
      `${TwoslashPopupContainer.NAME} must contain a ${TwoslashPopupArrow.NAME} element`,
    );
  }

  #registerUpdatePosition(
    trigger: TwoslashPopupTrigger,
    popup: TwoslashPopupContainer,
  ): () => void {
    const arrowElement = popup.findArrow();
    return autoUpdate(trigger, popup, async () => {
      const position = await computePosition(trigger, popup, {
        placement: 'bottom-start',
        middleware: [
          offset(4),
          // When specifying a minimum size, the size middleware must take precedence over the flip middleware.
          // See: https://floating-ui.com/docs/size#initialplacement
          size({
            padding: 16,
            apply: ({ availableWidth, availableHeight, elements }) => {
              elements.floating.style.maxWidth = `${Math.min(700, Math.max(100, availableWidth))}px`;
              elements.floating.style.maxHeight = `${Math.min(500, Math.max(100, availableHeight))}px`;
            },
          }),
          // When edge-aligned placements, the flip middleware must take precedence over the shift middleware.
          // See: https://floating-ui.com/docs/flip#combining-with-shift
          popup.dataset.always !== 'true' &&
            flip({
              fallbackStrategy: 'initialPlacement',
            }),
          shift({ padding: 16 }),
          // Arrow must be the last middleware.
          // See: https://floating-ui.com/docs/arrow#order
          arrow({ padding: 8, element: arrowElement }),
        ],
      });

      popup.style.left = `${position.x}px`;
      popup.style.top = `${position.y}px`;
      arrowElement.style.left = `${position.middlewareData.arrow?.x}px`;
      arrowElement.style.top = `${position.middlewareData.arrow?.y}px`;
      arrowElement.dataset.side = position.placement;
    });
  }

  #registerPopupEvent(
    trigger: TwoslashPopupTrigger,
    popup: TwoslashPopupContainer,
  ) {
    // If the popup is always visible, do nothing.
    if (popup.dataset.always === 'true') {
      return () => {};
    }

    let timeoutId: NodeJS.Timeout | null = null;

    const showPopup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      popup.dataset.state = 'show';
    };

    const hidePopup = () => {
      // Add a slight delay to avoid flickering when moving the mouse between the trigger and the popup.
      timeoutId = setTimeout(() => {
        popup.dataset.state = 'hidden';
      }, 100);
    };

    trigger.addEventListener('mouseenter', showPopup);
    trigger.addEventListener('mouseleave', hidePopup);
    popup.addEventListener('mouseenter', showPopup);
    popup.addEventListener('mouseleave', hidePopup);

    return () => {
      trigger.removeEventListener('mouseenter', showPopup);
      trigger.removeEventListener('mouseleave', hidePopup);
      popup.removeEventListener('mouseenter', showPopup);
      popup.removeEventListener('mouseleave', hidePopup);
    };
  }
}

export default TwoslashPopupContainer;
