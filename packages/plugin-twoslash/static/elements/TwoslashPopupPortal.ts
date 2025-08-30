class TwoslashPopupPortal extends HTMLElement {
  static NAME = 'twoslash-popup-portal' as const;

  static get instance(): Element {
    const element = document.querySelector(TwoslashPopupPortal.NAME);
    if (!element) {
      // Create a portal outside the DOM tree managed by React.
      const portal = document.createElement(TwoslashPopupPortal.NAME);
      portal.className = 'twoslash';
      document.body.append(portal);
      return portal;
    }
    return element;
  }
}

export default TwoslashPopupPortal;
