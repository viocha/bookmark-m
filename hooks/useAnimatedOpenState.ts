import { useLayoutEffect, useRef, useState } from 'react';

type AnimatedOpenState = {
  present: boolean;
  state: 'open' | 'closed';
};

export function useAnimatedOpenState(open: boolean, duration = 160): AnimatedOpenState {
  const [present, setPresent] = useState(open);
  const [state, setState] = useState<'open' | 'closed'>(open ? 'open' : 'closed');
  const timeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (open) {
      setPresent(true);
      setState('open');
      return;
    }

    setState('closed');
    timeoutRef.current = window.setTimeout(() => {
      setPresent(false);
      timeoutRef.current = null;
    }, duration);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [duration, open]);

  return { present, state };
}
