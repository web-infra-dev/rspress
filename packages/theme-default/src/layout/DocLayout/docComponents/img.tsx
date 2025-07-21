import { normalizeImagePath } from '@rspress/runtime';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import type { ComponentProps } from 'react';

export const Img = (props: ComponentProps<'img'>) => {
  return <img {...props} src={normalizeImagePath(props.src || '')} />;
};

const ImgZoomProps = JSON.parse(process.env.MEDIUM_ZOOM_OPTIONS || '');

export const ImgZoom = (props: ComponentProps<'img'>) => {
  return (
    <Zoom {...ImgZoomProps}>
      <img {...props} src={normalizeImagePath(props.src || '')} />
    </Zoom>
  );
};
