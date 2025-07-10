import { useEffect, useState } from 'react';

export const Term = () => {
  const [text, setText] = useState<string>()
  useEffect(()=>{
    const timeoutId = setTimeout(() => 
      setText('dynamic content')
    , 1000);
    return () => clearTimeout(timeoutId);
  }, []);
  return text;
}

export default Term;
