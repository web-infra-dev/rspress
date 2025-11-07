import { type ReactNode, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

// TODO: fallback should be a loading spinner
export const Content = ({ fallback = <></> }: { fallback?: ReactNode }) => {
  return (
    <Suspense fallback={fallback}>
      <Outlet />
    </Suspense>
  );
};
