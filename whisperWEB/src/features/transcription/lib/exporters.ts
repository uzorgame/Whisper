import type { TranscriptSegment } from '../model/types'

export type ExportFormat = 'srt' | 'vtt' | 'txt'

function subtitleStamp(seconds: number, separator: ',' | '.'): string {
  const total = Math.max(0, seconds)
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(Math.floor(total % 60)).padStart(2, '0')
  const ms = String(Math.round((total % 1) * 1000)).padStart(3, '0')

  return `${hh}:${mm}:${ss}${separator}${ms}`
}

function toSRT(segments: TranscriptSegment[]): string {
  return segments
    .map((segment, index) => {
      const from = subtitleStamp(segment.start, ',')
      const to = subtitleStamp(segment.end, ',')
      return `${index + 1}\n${from} --> ${to}\n${segment.text}\n`
    })
    .join('\n')
}

function toVTT(segments: TranscriptSegment[]): string {
  const cues = segments
    .map((segment) => {
      const from = subtitleStamp(segment.start, '.')
      const to = subtitleStamp(segment.end, '.')
      return `${from} --> ${to}\n${segment.text}\n`
    })
    .join('\n')

  return `WEBVTT\n\n${cues}`
}

function toPlainText(segments: TranscriptSegment[]): string {
  return segments.map((segment) => segment.text).join(' ')
}

const SERIALISERS: Record<ExportFormat, (s: TranscriptSegment[]) => string> = {
  srt: toSRT,
  vtt: toVTT,
  txt: toPlainText,
}

export function serialiseTranscript(
  segments: TranscriptSegment[],
  format: ExportFormat,
): string {
  return SERIALISERS[format](segments)
}

export { toPlainText }
