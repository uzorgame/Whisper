import styles from './ProgressBar.module.css'

interface Props {
  /** 0–100, or null when the duration is unknown */
  value: number | null
}

export function ProgressBar({ value }: Props) {
  const indeterminate = value === null

  return (
    <div
      className={[styles.track, indeterminate && styles.indeterminate]
        .filter(Boolean)
        .join(' ')}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={styles.fill}
        style={indeterminate ? undefined : { width: `${value}%` }}
      />
    </div>
  )
}
