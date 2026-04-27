import { useState, useEffect, useCallback } from 'react';

export function useCountUp(target, duration = 1100, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let tid, rid, t0;
    tid = setTimeout(() => {
      const step = ts => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / duration, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) rid = requestAnimationFrame(step);
      };
      rid = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(tid); cancelAnimationFrame(rid); };
  }, [target, duration, delay]);
  return val;
}

export function useBarWidth(pct, delay = 0) {
  const [w, setW] = useState(0);
  useEffect(() => {
    let tid, rid, t0;
    tid = setTimeout(() => {
      const step = ts => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / 900, 1);
        setW((1 - Math.pow(1 - p, 4)) * pct);
        if (p < 1) rid = requestAnimationFrame(step);
      };
      rid = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(tid); cancelAnimationFrame(rid); };
  }, [pct, delay]);
  return w;
}

export function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const tid = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(tid);
  }, [delay]);
  return visible;
}

export function useTweaks(defaults) {
  const storageKey = 'f1-tweaks';
  const getInitial = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  };
  const [values, setValues] = useState(getInitial);

  const setTweak = useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues(prev => {
      const next = { ...prev, ...edits };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return [values, setTweak];
}
