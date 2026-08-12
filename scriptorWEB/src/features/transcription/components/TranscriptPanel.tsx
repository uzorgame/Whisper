import { Panel, PanelSection } from '../../../shared/ui/Panel'
import { formatDuration, formatTimecode } from '../../../shared/lib/format'
import { toPlainText } from '../lib/exporters'
import type { TranscriptionResult } from '../model/types'
import { ExportMenu } from './ExportMenu'
import styles from './TranscriptPanel.module.css'

interface Props {
  result: TranscriptionResult
  sourceName: string
}

export function TranscriptPanel({ result, sourceName }: Props) {
  const realtimeFactor =
    result.elapsed > 0 ? result.duration / result.elapsed : 0
  const wordCount = toPlainText(result.segments).split(/\s+/).filter(Boolean)
    .length

  return (
    <Panel>
      <PanelSection tone="dark">
        <div className={styles.head}>
          <div>
            <h2 className={styles.title}>Transcript</h2>
            <p className={styles.subtitle}>
              {result.segments.length} segments ·{' '}
              {formatTimecode(result.duration)} of audio
            </p>
          </div>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricValue}>
                {formatDuration(result.elapsed)}
              </div>
              <div className={styles.metricLabel}>Compute</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>
                {realtimeFactor.toFixed(1)}×
              </div>
              <div className={styles.metricLabel}>Realtime</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>
                {result.device === 'webgpu' ? 'WebGPU' : 'CPU'}
              </div>
              <div className={styles.metricLabel}>Backend</div>
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection flush>
        <div className={styles.body} data-lenis-prevent>
          {result.segments.map((segment, index) => (
            <p className={styles.segment} key={`${segment.start}-${index}`}>
              <span className={styles.time}>
                ({formatTimecode(segment.start)})
              </span>
              <span className={styles.text}>{segment.text}</span>
            </p>
          ))}
        </div>
      </PanelSection>

      <PanelSection tone="muted">
        <div className={styles.foot}>
          <span className={styles.wordCount}>
            {wordCount.toLocaleString('en-US')} words
          </span>
          <ExportMenu result={result} sourceName={sourceName} />
        </div>
      </PanelSection>
    </Panel>
  )
}
