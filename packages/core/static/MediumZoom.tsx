import { useLocation } from '@rspress/core/runtime';
import mediumZoom, { type Zoom, type ZoomOptions } from 'medium-zoom';
import { useEffect } from 'react';
import './MediumZoom.css';

interface Props {
  selector?: string;
  options?: ZoomOptions;
}

export default function MediumZoom(props: Props) {
  const { pathname } = useLocation();
  const { selector = '.rspress-doc img', options = {} } = props;

  useEffect(() => {
    let zoom: Zoom | undefined;
    const timeout = setTimeout(() => {
      const images = document.querySelectorAll(selector);
      zoom = mediumZoom(images, { ...options, background: 'var(--rp-c-bg)' });
    }, 100);
    return () => {
      clearTimeout(timeout);
      zoom?.detach();
      zoom?.close();
    };
  }, [pathname]);

  return null;
}
