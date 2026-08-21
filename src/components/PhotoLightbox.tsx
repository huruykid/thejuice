import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * In-app photo viewer — replaces the old window.open(signedUrl) which ripped
 * users out of the app (external browser in the Capacitor shell), exposed raw
 * storage URLs, and bypassed screenshot protection.
 *
 * Gestures: swipe left/right between photos, pinch to zoom (1–4x), drag to pan
 * while zoomed, double-tap to toggle zoom, swipe down (or tap X / backdrop /
 * Escape) to close.
 */
interface PhotoLightboxProps {
  urls: string[];
  initialIndex?: number;
  onClose: () => void;
}

const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;

const PhotoLightbox = ({ urls, initialIndex = 0, onClose }: PhotoLightboxProps) => {
  const [index, setIndex] = useState(Math.min(initialIndex, urls.length - 1));
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const downPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTap = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const resetTransform = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= urls.length) return;
      setIndex(next);
      resetTransform();
    },
    [urls.length, resetTransform]
  );

  // Escape to close, arrows to navigate; lock body scroll; focus the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, goTo, onClose]);

  const pinchDistance = () => {
    const pts = [...pointers.current.values()];
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      pinchStart.current = { dist: pinchDistance(), scale };
      dragStart.current = null;
      downPos.current = null;
    } else if (pointers.current.size === 1) {
      downPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      if (scale > 1) dragStart.current = { x: e.clientX, y: e.clientY, tx, ty };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const next = (pinchDistance() / pinchStart.current.dist) * pinchStart.current.scale;
      setScale(Math.min(MAX_SCALE, Math.max(1, next)));
    } else if (pointers.current.size === 1 && dragStart.current && scale > 1) {
      setTx(dragStart.current.tx + (e.clientX - dragStart.current.x));
      setTy(dragStart.current.ty + (e.clientY - dragStart.current.y));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      const down = downPos.current;
      downPos.current = null;
      dragStart.current = null;
      if (scale > 1 && scale < 1.05) resetTransform();
      if (!down) return;

      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const moved = Math.hypot(dx, dy);

      // Tap (no movement): double-tap toggles zoom.
      if (moved < 12) {
        const now = Date.now();
        if (now - lastTap.current < DOUBLE_TAP_MS) {
          lastTap.current = 0;
          if (scale > 1) resetTransform();
          else setScale(2.5);
        } else {
          lastTap.current = now;
        }
        return;
      }

      // Swipes only apply at rest scale — while zoomed, movement means panning.
      if (scale === 1) {
        if (dy > 80 && Math.abs(dx) < Math.abs(dy)) return onClose();
        if (dx < -60) return goTo(index + 1);
        if (dx > 60) return goTo(index - 1);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${urls.length}`}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center select-none"
      onClick={(e) => {
        // Backdrop tap closes; taps on the image are handled by pointer logic.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        ref={closeButtonRef}
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 z-10 min-h-11 min-w-11 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {urls.length > 1 && (
        <div className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
          {index + 1} / {urls.length}
        </div>
      )}

      <div
        className="max-h-full max-w-full overflow-hidden"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={urls[index]}
          alt={`Photo ${index + 1}`}
          draggable={false}
          className="max-h-[100dvh] max-w-[100vw] object-contain"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: pointers.current.size > 0 ? "none" : "transform 150ms ease-out",
          }}
        />
      </div>

      {urls.length > 1 && index > 0 && (
        <button
          onClick={() => goTo(index - 1)}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {urls.length > 1 && index < urls.length - 1 && (
        <button
          onClick={() => goTo(index + 1)}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default PhotoLightbox;
