import { useLocation } from 'rspress/runtime';
import mediumZoom from 'medium-zoom';
import { useEffect } from 'react';
import './MediumZoom.css';

interface Props {
  selector?: string;
}

export default function MediumZoom(props: Props) {
  const { pathname } = useLocation();
  const { selector = '.rspress-doc img' } = props;

  useEffect(() => {
    const images = document.querySelectorAll(selector);
    mediumZoom(images);
  }, [pathname]);
  return null;
}
