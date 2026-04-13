import type { ReactNode } from 'react';
import { useOutlet } from 'react-router-dom';

// TODO: fallback should be a loading spinner
export const Content = ({ fallback = <></> }: { fallback?: ReactNode }) => {
  const outlet = useOutlet();
  return outlet ?? fallback;
};
