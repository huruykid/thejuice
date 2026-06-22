import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "pulling" | "armed" | "refreshing";

interface Options {
  onRefresh: () => Promise<unknown> | unknown;
  armDistance?: number;
  triggerDistance?: number;
  maxDistance?: number;
  disabled?: boolean;
}

/**
 * Generic pull-to-refresh using PointerEvents. Works with touch (mobile)
 * and mouse (desktop). Only activates when the page is scrolled to the top.
 */
export function usePullToRefresh({
  onRefresh,
  armDistance = 60,
  triggerDistance = 90,
  maxDistance = 140,
  disabled = false,
}: Options) {
  const [pullDistance, setPullDistance] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  const reset = useCallback(() => {
    startY.current = null;
    pulling.current = false;
    setPullDistance(0);
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (disabled) return;

    const onPointerDown = (e: PointerEvent) => {
      if (status === "refreshing") return;
      // Only at the very top of the page.
      if (window.scrollY > 0) return;
      // Ignore right/middle clicks for mouse.
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startY.current = e.clientY;
      pulling.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (startY.current === null || status === "refreshing") return;
      const delta = e.clientY - startY.current;
      if (delta <= 0) {
        if (pulling.current) {
          pulling.current = false;
          setPullDistance(0);
          setStatus("idle");
        }
        return;
      }
      if (window.scrollY > 0) {
        startY.current = null;
        pulling.current = false;
        setPullDistance(0);
        setStatus("idle");
        return;
      }
      pulling.current = true;
      // Damped distance.
      const damped = Math.min(maxDistance, Math.pow(delta, 0.85));
      setPullDistance(damped);
      setStatus(damped >= triggerDistance ? "armed" : "pulling");
      // Prevent the browser's native overscroll while we own the gesture.
      if (e.cancelable) e.preventDefault();
    };

    const onPointerUp = async () => {
      if (!pulling.current) {
        startY.current = null;
        return;
      }
      const shouldRefresh = pullDistance >= triggerDistance;
      startY.current = null;
      pulling.current = false;
      if (shouldRefresh) {
        setStatus("refreshing");
        setPullDistance(armDistance);
        try {
          await onRefresh();
        } finally {
          reset();
        }
      } else {
        reset();
      }
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", reset, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", reset);
    };
  }, [disabled, status, pullDistance, triggerDistance, armDistance, maxDistance, onRefresh, reset]);

  return { pullDistance, status, isRefreshing: status === "refreshing" };
}