import { useNavTransparent } from './useNavTransparent';
import './index.scss';

function HomeBackground({
  className,
  ...otherProps
}: React.HTMLAttributes<HTMLDivElement>) {
  const styleDom = useNavTransparent();

  return (
    <>
      {styleDom}
      <div className={`rp-home-background ${className}`} {...otherProps}></div>
    </>
  );
}

export { HomeBackground };
