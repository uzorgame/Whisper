import type { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  children: ReactNode
  className?: string
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div className={[styles.panel, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

interface PanelSectionProps {
  children: ReactNode
  tone?: 'default' | 'muted' | 'dark'
  flush?: boolean
  className?: string
}

export function PanelSection({
  children,
  tone = 'default',
  flush = false,
  className,
}: PanelSectionProps) {
  const toneClass =
    tone === 'muted'
      ? styles.sectionMuted
      : tone === 'dark'
        ? styles.sectionDark
        : undefined

  const classes = [styles.section, toneClass, flush && styles.flush, className]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}
