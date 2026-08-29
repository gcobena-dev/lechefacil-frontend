import { useRef } from "react";
import type { TouchEvent } from "react";

interface Options {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum horizontal travel, in px, before the gesture counts as a swipe. */
  threshold?: number;
}

/**
 * Horizontal swipe detection for touch screens, meant for moving between tabs.
 *
 * Gestures that are mostly vertical are ignored: those are the page scrolling.
 * Returns the touch handlers to spread on the element that should react.
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
}: Options) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (e: TouchEvent) => {
      // Multi-touch is a pinch/zoom, never a swipe
      if (e.touches.length !== 1) {
        start.current = null;
        return;
      }
      const touch = e.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (e: TouchEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - from.x;
      const dy = touch.clientY - from.y;
      if (Math.abs(dx) < threshold) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
  };
}
