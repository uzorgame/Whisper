import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDownIcon } from './icons'
import { usePopoverPosition } from './usePopoverPosition'
import styles from './Select.module.css'

export interface SelectOption<T extends string> {
  value: T
  label: string
  /** short trailing detail, e.g. a model size */
  meta?: string
  /** shown greyed out and not selectable — use `meta` to say why */
  disabled?: boolean
}

interface Props<T extends string> {
  label: string
  value: T
  options: SelectOption<T>[]
  hint?: string
  disabled?: boolean
  onChange: (value: T) => void
}

/**
 * Native <select> renders an OS-drawn popup that cannot be styled and closes on
 * unrelated re-renders. This is a listbox built from regular elements: it keeps
 * the service's own look and survives the recorder's timer updates.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  hint,
  disabled,
  onChange,
}: Props<T>) {
  const labelId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const placement = usePopoverPosition(triggerRef, open, { matchWidth: true })

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const selected = options[selectedIndex]

  function openList() {
    setActiveIndex(selectedIndex)
    setOpen(true)
  }

  function commit(index: number) {
    const option = options[index]
    if (!option || option.disabled) return
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  /** Arrow keys walk over unavailable options rather than stopping on them. */
  function nextEnabled(from: number, step: 1 | -1): number {
    for (let i = from; i >= 0 && i < options.length; i += step) {
      if (!options[i].disabled) return i
    }
    return from
  }

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        !listRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openList()
      }
      return
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        break
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) =>
          nextEnabled(Math.min(options.length - 1, index + 1), 1),
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => nextEnabled(Math.max(0, index - 1), -1))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(nextEnabled(0, 1))
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(nextEnabled(options.length - 1, -1))
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        commit(activeIndex)
        break
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label} id={labelId}>
        {label}
      </span>

      <button
        ref={triggerRef}
        type="button"
        className={[styles.trigger, open && styles.triggerOpen]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
      >
        <span>{selected?.label ?? ''}</span>
        <ChevronDownIcon
          className={[styles.chevron, open && styles.chevronOpen]
            .filter(Boolean)
            .join(' ')}
        />
      </button>

      {hint && <p className={styles.hint}>{hint}</p>}

      {open &&
        placement &&
        createPortal(
          <div
            ref={listRef}
            className={styles.listbox}
            role="listbox"
            aria-labelledby={labelId}
            data-lenis-prevent
            style={{
              top: placement.top,
              left: placement.left,
              minWidth: placement.minWidth,
              maxHeight: placement.maxHeight,
            }}
            onKeyDown={handleKeyDown}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="option"
                disabled={option.disabled}
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                className={[
                  styles.option,
                  !option.disabled &&
                    index === activeIndex &&
                    styles.optionActive,
                  option.value === value && styles.optionSelected,
                  option.disabled && styles.optionDisabled,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                onClick={() => commit(index)}
              >
                <span>{option.label}</span>
                {option.meta && (
                  <span className={styles.optionMeta}>{option.meta}</span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
