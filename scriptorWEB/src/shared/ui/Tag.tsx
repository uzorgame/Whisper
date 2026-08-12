import type { ReactNode } from 'react'
import styles from './Tag.module.css'

export type TagTone = 'outline' | 'primary' | 'tint' | 'success' | 'neutral'

interface Props {
  children: ReactNode
  tone?: TagTone
}

const TONE_CLASS: Record<TagTone, string | undefined> = {
  outline: undefined,
  primary: styles.primary,
  tint: styles.tint,
  success: styles.success,
  neutral: styles.neutral,
}

export function Tag({ children, tone = 'outline' }: Props) {
  return (
    <span className={[styles.tag, TONE_CLASS[tone]].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
