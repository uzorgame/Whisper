import { useCallback, useState } from 'react'
import { decodeAudioFile } from '../../../shared/lib/audio'

export interface MediaFileState {
  file: File | null
  duration: number | null
  select: (file: File) => Promise<void>
  clear: () => void
}

/**
 * Holds the picked file and probes its duration up front so the UI can show
 * length before anything is transcribed. Decode failures stay silent here —
 * they surface with a proper message when a run is actually started.
 */
export function useMediaFile(): MediaFileState {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)

  const select = useCallback(async (picked: File) => {
    setFile(picked)
    setDuration(null)

    try {
      const decoded = await decodeAudioFile(picked)
      setDuration(decoded.duration)
    } catch {
      setDuration(null)
    }
  }, [])

  const clear = useCallback(() => {
    setFile(null)
    setDuration(null)
  }, [])

  return { file, duration, select, clear }
}
