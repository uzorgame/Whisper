import { useRef, useState, type DragEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Tag } from '../../../shared/ui/Tag'
import { MicIcon } from '../../../shared/ui/icons'
import { formatBytes, formatTimecode } from '../../../shared/lib/format'
import styles from './FileDropzone.module.css'

const ACCEPTED =
  'audio/*,video/*,.mp3,.wav,.m4a,.ogg,.flac,.mp4,.webm,.mov,.aac'

interface Props {
  file: File | null
  duration: number | null
  disabled: boolean
  onSelect: (file: File) => void
  onClear: () => void
  onRecord: () => void
}

export function FileDropzone({
  file,
  duration,
  disabled,
  onSelect,
  onClear,
  onRecord,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const dropped = event.dataTransfer.files?.[0]
    if (dropped) onSelect(dropped)
  }

  if (file) {
    return (
      <div className={styles.selected}>
        <div className={styles.meta}>
          <Tag tone="primary">File</Tag>
          <div style={{ minWidth: 0 }}>
            <div className={styles.name} title={file.name}>
              {file.name}
            </div>
            <div className={styles.stats}>
              {formatBytes(file.size)}
              {duration !== null && ` · ${formatTimecode(duration)}`}
            </div>
          </div>
        </div>
        <Button onClick={onClear} disabled={disabled}>
          Replace
        </Button>
      </div>
    )
  }

  return (
    <div
      className={[styles.zone, isDragging && styles.dragging]
        .filter(Boolean)
        .join(' ')}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className={styles.icon}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4.5 16.5V19h15v-2.5"
            stroke="#FFFEFB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className={styles.title}>Drop audio or video here</h2>
      <p className={styles.hint}>
        mp3 · wav · m4a · ogg · flac · mp4 · webm — nothing is uploaded anywhere
      </p>

      <div className={styles.action}>
        <Button
          variant="primary"
          size="lg"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Choose a file
        </Button>
        <Button size="lg" onClick={onRecord} disabled={disabled}>
          <MicIcon />
          Record audio
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        hidden
        onChange={(event) => {
          const picked = event.target.files?.[0]
          if (picked) onSelect(picked)
          event.target.value = ''
        }}
      />
    </div>
  )
}
