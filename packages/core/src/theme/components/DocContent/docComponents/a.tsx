eimport { useSite } from '@rspress/core/runtime';
import { Link } from '@rspress/core/theme';
import { startTransition, type ComponentProps } from 'react';

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
