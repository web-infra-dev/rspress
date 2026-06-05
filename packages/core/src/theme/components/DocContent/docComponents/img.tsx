import { normalizeImagePath } from '@rspress/core/runtime';
import mediumZoom, { type Zoom } from 'medium-zoom';
import { useEffect, useRef, type ComponentProps } from 'react';
import '../../../../../static/MediumZoom.css';

export const Img = (props: ComponentProps<'img'>) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const src = normalizeImagePath(props.src || '');

  useEffect(() => {
    const img = imgRef.current;
    if (!img) {
      return;
    }

    const zoom: Zoom = mediumZoom(img, {
      background: 'var(--rp-c-bg)',
    });

    return () => {
      zoom.detach();
      zoom.close();
    };
  }, [src]);

  return <img {...props} ref={imgRef} src={src} />;
};
