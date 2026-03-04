import { useNavTransparent } from './useNavTransparent';
import './index.scss';
import clsx from 'clsx';

function HomeBackground({
  className,
  ...otherProps
}: React.HTMLAttributes<HTMLDivElement>) {
  const styleDom = useNavTransparent();

  return (
    <>
      {styleDom}
      <div
        className={clsx('rp-home-background', className)}
        {...otherProps}
      ></div>
    </>
  );
}

export { HomeBackground };
