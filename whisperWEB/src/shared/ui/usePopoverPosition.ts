import { useCallback, useEffect, useState, type RefObject } from 'react'

export interface PopoverPlacement {
  /** set when the panel opens downward */
  top?: number
  /** set when the panel opens upward — anchoring by the bottom edge keeps the
   *  panel glued to the trigger no matter how short its content turns out */
  bottom?: number
  left: number
  minWidth: number
  maxHeight: number
}

interface Options {
  /** stretch the panel to the trigger width instead of just matching its minimum */
  matchWidth?: boolean
  /** align the panel's right edge with the trigger's right edge */
  alignEnd?: boolean
  gap?: number
  preferredHeight?: number
}

const VIEWPORT_MARGIN = 12

/**
 * Fixed-position placement for panels rendered through a portal. Portals escape
 * `overflow: hidden` ancestors, and flipping upward keeps the panel on screen
 * when the trigger sits near the bottom of the viewport.
 */
export function usePopoverPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  { matchWidth, alignEnd, gap = 6, preferredHeight = 320 }: Options = {},
): PopoverPlacement | null {
  const [placement, setPlacement] = useState<PopoverPlacement | null>(null)

  const measure = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - gap - VIEWPORT_MARGIN
    const spaceAbove = rect.top - gap - VIEWPORT_MARGIN

    const openUp =
      spaceBelow < Math.min(preferredHeight, 180) && spaceAbove > spaceBelow

    const width = matchWidth ? rect.width : Math.max(rect.width, 200)
    let left = alignEnd ? rect.right - width : rect.left
    left = Math.min(
      Math.max(VIEWPORT_MARGIN, left),
      window.innerWidth - width - VIEWPORT_MARGIN,
    )

    setPlacement({
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
      left,
      minWidth: width,
      maxHeight: Math.max(
        120,
        Math.min(preferredHeight, openUp ? spaceAbove : spaceBelow),
      ),
    })
  }, [anchorRef, alignEnd, gap, matchWidth, preferredHeight])

  useEffect(() => {
    if (!open) {
      setPlacement(null)
      return
    }

    measure()

    // capture phase catches scrolling inside any nested container too
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)

    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [open, measure])

  return placement
}
