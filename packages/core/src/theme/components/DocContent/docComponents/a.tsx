import { Link } from '@rspress/core/theme';
import { startTransition, type ComponentProps } from 'react';
import { useSite } from '@rspress/core/runtime';

export const A = (props: ComponentProps<'a'>) => {
  const siteData = useSite();
  const concurrentRoute = siteData?.site?.route?.concurrentRoute;
  return (
    <Link
      startTransition={concurrentRoute ? startTransition : undefined}
      {...props}
    />
  );
};
