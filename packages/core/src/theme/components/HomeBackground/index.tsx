import { useNavTransparent } from './useNavTransparent';
import './index.scss';
import { PREFIX } from '../../constant';

function HomeBackground({
  className,
  ...otherProps
}: React.HTMLAttributes<HTMLDivElement>) {
  const styleDom = useNavTransparent();

  return (
    <>
      {styleDom}
      <div
        className={`${PREFIX}home-background ${className}`}
        {...otherProps}
      ></div>
    </>
  );
}

export { HomeBackground };
