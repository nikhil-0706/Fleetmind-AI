import { useEffect, useRef } from 'react';

export function usePolling(callback, interval = 30000, dependencies = []) {
  const savedCallback = useRef();
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    const tick = () => savedCallback.current?.();
    tick();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, ...dependencies]);
}