import { forwardRef, type ImgHTMLAttributes } from 'react';
import * as ReactDOM from 'react-dom';

type ReactDOMWithPreload = typeof ReactDOM & {
  preload?: (
    href: string,
    options?: {
      as: 'image';
      imageSrcSet?: string;
      imageSizes?: string;
      fetchPriority: 'high' | 'low' | 'auto' | undefined;
      crossOrigin?: '' | 'anonymous' | 'use-credentials';
      referrerPolicy?:
        | ''
        | 'no-referrer'
        | 'no-referrer-when-downgrade'
        | 'origin'
        | 'origin-when-cross-origin'
        | 'same-origin'
        | 'strict-origin'
        | 'strict-origin-when-cross-origin'
        | 'unsafe-url';
    },
  ) => void;
};

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  preload?: boolean;
}

const safePreload = (ReactDOM as ReactDOMWithPreload).preload;

const Image = forwardRef<HTMLImageElement, ImageProps>(
  (imgProps: ImageProps, ref) => {
    const {
      src,
      srcSet,
      sizes,
      fetchPriority,
      preload = false,
      referrerPolicy,
      crossOrigin,
      ...restImgProps
    } = imgProps;

    if (preload === true && src && typeof safePreload === 'function') {
      safePreload(src, {
        as: 'image',
        imageSizes: sizes,
        imageSrcSet: srcSet,
        fetchPriority: fetchPriority,
        crossOrigin: crossOrigin,
        referrerPolicy: referrerPolicy,
      });
    }

    return (
      <img
        ref={ref}
        data-rspress-img-preload={preload ? '' : undefined}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        fetchPriority={fetchPriority}
        crossOrigin={crossOrigin}
        referrerPolicy={referrerPolicy}
        {...restImgProps}
      />
    );
  },
);
Image.displayName = 'Image';

export { Image };
