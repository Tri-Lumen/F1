"use client";

import { useEffect, useState } from "react";

export function useCountUp(target: number, duration = 1100, delay = 0): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>;
    let rid: number;
    tid = setTimeout(() => {
      let t0 = 0;
      const step = (ts: number) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / duration, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) rid = requestAnimationFrame(step);
      };
      rid = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(tid);
      cancelAnimationFrame(rid);
    };
  }, [target, duration, delay]);
  return val;
}

export function useBarWidth(pct: number, delay = 0): number {
  const [w, setW] = useState(0);
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>;
    let rid: number;
    tid = setTimeout(() => {
      let t0 = 0;
      const step = (ts: number) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / 900, 1);
        setW((1 - Math.pow(1 - p, 4)) * pct);
        if (p < 1) rid = requestAnimationFrame(step);
      };
      rid = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(tid);
      cancelAnimationFrame(rid);
    };
  }, [pct, delay]);
  return w;
}

export function useFadeIn(delay = 0): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const tid = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(tid);
  }, [delay]);
  return visible;
}
