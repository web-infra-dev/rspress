import { useEffect, useState } from 'react';

const useTopArrived = () => {
  const [scrollY, setScrollY] = useState(0);
  const topArrived = scrollY < 100;

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, {
      capture: false,
      passive: true,
    });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    topArrived,
  };
};

export const useNavTransparent = () => {
  const { topArrived } = useTopArrived();

  useEffect(() => {
    if (topArrived) {
      document.body.classList.remove('notTopArrived');
    } else {
      document.body.classList.add('notTopArrived');
    }
  }, [topArrived]);

  return (
    <style>
      {'body:not(.notTopArrived) .rp-nav {background: transparent !important; border-bottom: none !important;}' +
        // TODO: discussion
        '.rp-nav {background: color-mix(in srgb,var(--rp-c-bg) 60%,transparent);backdrop-filter: blur(25px);}'}
    </style>
  );
};
