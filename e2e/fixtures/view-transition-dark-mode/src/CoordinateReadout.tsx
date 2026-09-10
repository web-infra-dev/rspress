import { useEffect, useState } from 'react';

type PointerSnapshot = {
  clientX: number;
  clientY: number;
  devicePixelRatio: number;
  innerHeight: number;
  innerWidth: number;
};

const readPointerSnapshot = (event?: PointerEvent): PointerSnapshot => ({
  clientX: Math.round(event?.clientX ?? 0),
  clientY: Math.round(event?.clientY ?? 0),
  devicePixelRatio: window.devicePixelRatio,
  innerHeight: window.innerHeight,
  innerWidth: window.innerWidth,
});

export function CoordinateReadout() {
  const [snapshot, setSnapshot] = useState<PointerSnapshot>();

  useEffect(() => {
    setSnapshot(readPointerSnapshot());

    const updatePointer = (event: PointerEvent) => {
      setSnapshot(readPointerSnapshot(event));
    };
    const updateViewport = () => setSnapshot(readPointerSnapshot());

    window.addEventListener('pointerdown', updatePointer, true);
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('pointerdown', updatePointer, true);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  if (!snapshot) {
    return null;
  }

  return (
    <output className="coordinate-readout">
      <span>
        click: {snapshot.clientX}, {snapshot.clientY}
      </span>
      <span>
        viewport: {snapshot.innerWidth} × {snapshot.innerHeight}
      </span>
      <span>DPR: {snapshot.devicePixelRatio}</span>
    </output>
  );
}
