import { useEffect, useState } from 'react';

const updateFns: Record<string, () => void> = {};
let subScribedCount = 0;

const useForceUpdate = () => {
  const [, setTick] = useState(0);
  return () => setTick(tick => tick + 1);
};
const distributeUpdate = () => {
  for (const fn of Object.values(updateFns)) {
    fn();
  }
};
const useSubScribe = () => {
  const forceUpdate = useForceUpdate();
  useEffect(() => {
    const id = Math.random().toString(36).slice(2);
    subScribedCount++;
    updateFns[id] = forceUpdate;

    return () => {
      subScribedCount--;
      delete updateFns[id];
    };
  }, [forceUpdate]);

  return {
    subScribedCount,
  };
};

export { distributeUpdate, useSubScribe };
