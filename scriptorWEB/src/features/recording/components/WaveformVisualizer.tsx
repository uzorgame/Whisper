import { useEffect, useRef } from 'react'
import { formatTimecode } from '../../../shared/lib/format'
import type { RecorderStatus } from '../hooks/useAudioRecorder'
import styles from './WaveformVisualizer.module.css'

interface Props {
  analyser: AnalyserNode | null
  status: RecorderStatus
  getElapsed: () => number
}

const BAR_WIDTH = 3
const BAR_GAP = 2
const MIN_BAR = 2

const STATUS_LABEL: Record<RecorderStatus, string> = {
  idle: 'Ready',
  recording: 'Recording',
  paused: 'Paused',
  stopped: 'Captured',
}

/**
 * Draws a scrolling amplitude history: newest sample on the right, older
 * samples shifting left. Both the bars and the timecode are written straight to
 * the DOM from the animation loop, so React re-renders only on status changes.
 */
export function WaveformVisualizer({ analyser, status, getElapsed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<HTMLSpanElement>(null)
  const historyRef = useRef<number[]>([])
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const samples = analyser ? new Uint8Array(analyser.fftSize) : null

    function readLevel(): number {
      if (!analyser || !samples || status !== 'recording') return 0

      analyser.getByteTimeDomainData(samples)
      let sumSquares = 0
      for (const sample of samples) {
        const centred = (sample - 128) / 128
        sumSquares += centred * centred
      }

      const rms = Math.sqrt(sumSquares / samples.length)
      // perceptual curve — quiet speech should still move the bars visibly
      return Math.min(1, Math.pow(rms * 3.2, 0.75))
    }

    function draw() {
      if (!canvas || !context) return

      if (timerRef.current) {
        timerRef.current.textContent = formatTimecode(getElapsed())
      }

      const ratio = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight

      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio
        canvas.height = height * ratio
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)

      const capacity = Math.floor(width / (BAR_WIDTH + BAR_GAP))
      const history = historyRef.current

      if (status === 'recording') {
        history.push(readLevel())
        while (history.length > capacity) history.shift()
      }

      const tokens = getComputedStyle(document.documentElement)
      const primary = tokens.getPropertyValue('--color-primary').trim()
      const muted = tokens.getPropertyValue('--color-border-muted').trim()

      const centre = (height - 34) / 2 + 4
      const maxBar = (height - 60) / 2

      // idle baseline so the panel never looks broken before recording starts
      if (history.length === 0) {
        context.fillStyle = muted
        context.fillRect(BAR_GAP, centre - 1, width - BAR_GAP * 2, 2)
      }

      history.forEach((level, index) => {
        const offset = history.length - 1 - index
        const x = width - BAR_GAP - (offset + 1) * (BAR_WIDTH + BAR_GAP)
        const barHeight = Math.max(MIN_BAR, level * maxBar * 2)

        // recent bars are full strength, older ones fade back
        const age = offset / Math.max(1, capacity)
        context.globalAlpha = status === 'paused' ? 0.45 : 1 - age * 0.55
        context.fillStyle = level > 0.02 ? primary : muted
        context.fillRect(x, centre - barHeight / 2, BAR_WIDTH, barHeight)
      })

      context.globalAlpha = 1
      frameRef.current = requestAnimationFrame(draw)
    }

    // paint once synchronously so the canvas is sized and the idle baseline is
    // visible even before the first animation frame arrives (hidden tabs never
    // fire requestAnimationFrame at all)
    draw()

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [analyser, status, getElapsed])

  useEffect(() => {
    if (status === 'idle') historyRef.current = []
  }, [status])

  return (
    <div className={styles.stage}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.overlay}>
        <span className={styles.state}>
          <span
            className={[styles.dot, status === 'recording' && styles.dotLive]
              .filter(Boolean)
              .join(' ')}
          />
          {STATUS_LABEL[status]}
        </span>
        <span className={styles.timer} ref={timerRef}>
          00:00
        </span>
      </div>
    </div>
  )
}
