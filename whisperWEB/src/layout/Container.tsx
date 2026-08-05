import type { ReactNode } from 'react'
import styles from './Container.module.css'

interface Props {
  children: ReactNode
  className?: string
}

export function Container({ children, className }: Props) {
  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
