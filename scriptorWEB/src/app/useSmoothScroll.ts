import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Smooth scrolling tuned to match uz-or.com: 1.2s glide on an exponential
 * ease-out. Nested scrollers (dialogs, listboxes, the transcript) opt out via
 * `data-lenis-prevent` so the wheel behaves normally inside them.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    })

    let frame = 0
    function raf(time: number) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])
}
