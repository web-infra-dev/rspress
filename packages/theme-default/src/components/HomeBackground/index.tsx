import { useNavTransparent } from './useNavTransparent';
import './index.scss';

function HomeBackground() {
  const styleDom = useNavTransparent();

  return (
    <>
      {styleDom}
      <div className="rp-home-background"></div>
    </>
  );
}

export { HomeBackground };
