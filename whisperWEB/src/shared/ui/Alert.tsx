import type { ReactNode } from 'react'
import styles from './Alert.module.css'

interface Props {
  children: ReactNode
}

export function Alert({ children }: Props) {
  return (
    <div className={styles.alert} role="alert">
      <svg
        className={styles.icon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 1.5 15 14H1L8 1.5ZM8 6v4M8 11.5v.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </div>
  )
}
