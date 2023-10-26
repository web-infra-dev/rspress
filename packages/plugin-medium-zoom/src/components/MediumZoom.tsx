import { useLocation } from '@rspress/runtime';
import mediumZoom, { ZoomOptions } from 'medium-zoom';
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
    setTimeout(() => {
      const images = document.querySelectorAll(selector);
      mediumZoom(images, options);
    }, 100);
  }, [pathname]);
  return null;
}
