import { useState } from 'react';

export default () => {
  const [count, setCount] = useState(0);
  return (
    <p>
      这是来自 tsx 的组件{' '}
      <button onClick={() => setCount(count => count + 1)}>{count}</button>
    </p>
  );
};
