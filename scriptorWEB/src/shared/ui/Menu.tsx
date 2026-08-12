import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { usePopoverPosition } from './usePopoverPosition'
import styles from './Menu.module.css'

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  heading?: string
  children: (props: { close: () => void }) => ReactNode
}

export function Menu({ trigger, heading, children }: MenuProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // rendered in a portal so `overflow: hidden` on the surrounding panel cannot
  // clip it, and flipped upward when the trigger sits near the viewport bottom
  const placement = usePopoverPosition(anchorRef, open, {
    alignEnd: true,
    preferredHeight: 300,
  })

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        !anchorRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className={styles.anchor} ref={anchorRef}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}

      {open &&
        placement &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            role="menu"
            data-lenis-prevent
            style={placement}
          >
            {heading && <div className={styles.heading}>{heading}</div>}
            {children({ close: () => setOpen(false) })}
          </div>,
          document.body,
        )}
    </div>
  )
}

interface MenuItemProps {
  icon?: ReactNode
  children: ReactNode
  disabled?: boolean
  onSelect: () => void
}

export function MenuItem({ icon, children, disabled, onSelect }: MenuItemProps) {
  return (
    <button
      className={styles.item}
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  )
}
