import { useEffect, useMemo, useState } from "react";

const formatRemaining = (ms: number) => {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const useTempCountdown = (expiresAt?: string | null) => {
  const target = useMemo(() => (expiresAt ? new Date(expiresAt).getTime() : null), [expiresAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (!target) {
    return { remainingMs: null, remainingLabel: null };
  }

  const remainingMs = Math.max(target - now, 0);
  return { remainingMs, remainingLabel: formatRemaining(remainingMs) };
};
