import { ProgressBar } from '../../../shared/ui/ProgressBar'
import { formatBytes } from '../../../shared/lib/format'
import type { ModelDownload, TranscriptionStage } from '../model/types'
import styles from './ProgressPanel.module.css'

interface Props {
  stage: TranscriptionStage
  downloads: ModelDownload[]
}

const STAGE_LABEL: Record<Exclude<TranscriptionStage, 'idle'>, string> = {
  decoding: 'Decoding audio',
  'loading-model': 'Loading model',
  transcribing: 'Transcribing',
}

/**
 * Overall progress is weighted by bytes, not by file count. Averaging per-file
 * percentages reads "87%" while six tiny JSON configs are done and the one file
 * that actually matters is 6% through a several-hundred-megabyte download.
 */
function overallPercent(downloads: ModelDownload[]): number | null {
  if (downloads.length === 0) return null

  const totalBytes = downloads.reduce((sum, item) => sum + item.total, 0)
  if (totalBytes > 0) {
    const loadedBytes = downloads.reduce((sum, item) => sum + item.loaded, 0)
    return (loadedBytes / totalBytes) * 100
  }

  // no Content-Length anywhere — fall back to the naive average
  return (
    downloads.reduce((sum, item) => sum + item.progress, 0) / downloads.length
  )
}

export function ProgressPanel({ stage, downloads }: Props) {
  if (stage === 'idle') return null

  const percent = overallPercent(downloads)
  const totalBytes = downloads.reduce((sum, item) => sum + item.total, 0)
  const loadedBytes = downloads.reduce((sum, item) => sum + item.loaded, 0)

  return (
    <div>
      <div className={styles.head}>
        <span className={styles.label}>{STAGE_LABEL[stage]}</span>
        <span className={styles.value}>
          {percent === null
            ? 'in progress'
            : totalBytes > 0
              ? `${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)} · ${percent.toFixed(0)}%`
              : `${percent.toFixed(0)}%`}
        </span>
      </div>

      <ProgressBar value={percent} />

      {downloads.length > 0 && (
        <div className={styles.files}>
          {downloads.map((item) => (
            <div className={styles.file} key={item.file}>
              <span className={styles.fileName}>{item.file}</span>
              <span>
                {item.total > 0 && `${formatBytes(item.total)} · `}
                {item.progress.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
