import { Button } from '../../../shared/ui/Button'
import styles from './RunBar.module.css'

interface Props {
  canRun: boolean
  isBusy: boolean
  onRun: () => void
  onCancel: () => void
}

export function RunBar({ canRun, isBusy, onRun, onCancel }: Props) {
  return (
    <div className={styles.bar}>
      <Button variant="primary" onClick={onRun} disabled={!canRun || isBusy}>
        {isBusy ? 'Working…' : 'Transcribe'}
      </Button>

      {isBusy && <Button onClick={onCancel}>Cancel</Button>}

      <div className={styles.spacer} />

      <p className={styles.note}>
        The first run downloads the model weights; after that they come from cache.
      </p>
    </div>
  )
}
