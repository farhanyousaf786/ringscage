import { useEffect, useRef } from 'react';

/** Calls cb(dt seconds) every animation frame while the component is mounted. */
export function useFrame(cb) {
  const ref = useRef(cb);
  ref.current = cb;

  useEffect(() => {
    let raf = 0;
    let alive = true;
    let last = Date.now();
    const loop = () => {
      if (!alive) return;
      const now = Date.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      try {
        ref.current(dt);
      } catch {
        /* never let a frame error kill the loop / app */
      }
      if (alive) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
