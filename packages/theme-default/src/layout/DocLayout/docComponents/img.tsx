import { normalizeImagePath } from '@rspress/runtime';
import mediumZoom from 'medium-zoom';
import type React from 'react';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useRef } from 'react';

export const Img = (props: ComponentProps<'img'>) => {
  return <img {...props} src={normalizeImagePath(props.src || '')} />;
};

export const ImgZoom = ({
  ref: refProp,
  ...props
}: ComponentProps<'img'> & { ref?: React.Ref<HTMLImageElement> }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const combinedRef = useCallback(
    (node: HTMLImageElement) => {
      if (refProp) {
        if (typeof refProp === 'function') {
          refProp(node);
        } else {
          refProp.current = node;
        }
      }
      imgRef.current = node;
    },
    [refProp],
  );

  useEffect(() => {
    if (!imgRef.current) return;
    const zoom = mediumZoom(imgRef.current, {
      background: 'var(--rp-c-bg)',
    });

    return () => {
      zoom.detach();
    };
  }, []);

  return <img ref={combinedRef} {...props} />;
};
