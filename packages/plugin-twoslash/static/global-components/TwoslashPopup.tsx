import { type FC, useEffect } from 'react';

const register = async () => {
  // To avoid errors during SSR, we use dynamic import
  const elements = await Promise.all([
    import('./elements/TwoslashPopupArrow'),
    import('./elements/TwoslashPopupContainer'),
    import('./elements/TwoslashPopupPortal'),
    import('./elements/TwoslashPopupTrigger'),
  ]);

  elements.forEach(element => {
    customElements.define(element.default.NAME, element.default);
  });
};

const TwoslashPopup: FC = () => {
  useEffect(() => {
    void register();
  }, []);

  return null;
};

export default TwoslashPopup;
