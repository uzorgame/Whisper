import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped'

/** below this the take is too short to be worth transcribing */
const MIN_USEFUL_SECONDS = 0.4

export interface AudioRecorderState {
  status: RecorderStatus
  /** true once enough audio exists to transcribe — a single state flip, not a tick */
  hasAudio: boolean
  error: string | null
  /** live analyser for the visualiser — React never re-renders on audio frames */
  analyser: AnalyserNode | null
  /** read the running time without subscribing to it */
  getElapsed: () => number
  start: () => Promise<void>
  pause: () => void
  resume: () => void
  /** stops the stream and returns the captured audio as a File */
  stop: () => Promise<File | null>
  discard: () => void
}

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
]

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))
}

function extensionFor(mimeType: string | undefined): string {
  if (!mimeType) return 'webm'
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}

export function useAudioRecorder(): AudioRecorderState {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [hasAudio, setHasAudio] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const tickRef = useRef<number | null>(null)

  // the running time is a ref on purpose: re-rendering ten times a second would
  // tear down any open popover in the dialog and burn frames for nothing
  const elapsedRef = useRef(0)

  const stopClock = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  const startClock = useCallback(() => {
    stopClock()
    tickRef.current = window.setInterval(() => {
      elapsedRef.current += 0.1
      if (elapsedRef.current >= MIN_USEFUL_SECONDS) {
        setHasAudio((current) => current || true)
      }
    }, 100)
  }, [stopClock])

  const teardown = useCallback(() => {
    stopClock()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void contextRef.current?.close()
    contextRef.current = null
    recorderRef.current = null
    setAnalyser(null)
  }, [stopClock])

  useEffect(() => teardown, [teardown])

  const start = useCallback(async () => {
    setError(null)
    elapsedRef.current = 0
    setHasAudio(false)
    chunksRef.current = []

    try {
      // Browser DSP is tuned for phone calls, not for speech recognition.
      // Echo cancellation and noise suppression reshape the spectrum Whisper
      // was trained on and visibly hurt accuracy; automatic gain is kept
      // because consistent loudness helps it.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
        },
      })
      streamRef.current = stream

      // separate graph purely for visualisation — it never touches the recording
      const context = new AudioContext()
      const source = context.createMediaStreamSource(stream)
      const node = context.createAnalyser()
      node.fftSize = 1024
      node.smoothingTimeConstant = 0.75
      source.connect(node)
      contextRef.current = context
      setAnalyser(node)

      // Chrome's default opus bitrate for MediaRecorder is low enough to smear
      // consonants, which is exactly what a transcriber needs to hear
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 128000,
      })
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      })
      recorder.start(250)
      recorderRef.current = recorder

      setStatus('recording')
      startClock()
    } catch (cause) {
      const message =
        cause instanceof DOMException && cause.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in the browser address bar and try again.'
          : cause instanceof Error
            ? cause.message
            : String(cause)

      setError(message)
      setStatus('idle')
      teardown()
    }
  }, [startClock, teardown])

  const pause = useCallback(() => {
    if (recorderRef.current?.state !== 'recording') return
    recorderRef.current.pause()
    stopClock()
    setStatus('paused')
  }, [stopClock])

  const resume = useCallback(() => {
    if (recorderRef.current?.state !== 'paused') return
    recorderRef.current.resume()
    startClock()
    setStatus('recording')
  }, [startClock])

  const stop = useCallback((): Promise<File | null> => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return Promise.resolve(null)

    return new Promise((resolve) => {
      recorder.addEventListener(
        'stop',
        () => {
          const type = recorder.mimeType || 'audio/webm'
          const blob = new Blob(chunksRef.current, { type })
          const file = new File(
            [blob],
            `recording.${extensionFor(recorder.mimeType)}`,
            { type },
          )

          teardown()
          setStatus('stopped')
          resolve(file)
        },
        { once: true },
      )

      recorder.stop()
    })
  }, [teardown])

  const discard = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    chunksRef.current = []
    teardown()
    setStatus('idle')
    setHasAudio(false)
    elapsedRef.current = 0
  }, [teardown])

  const getElapsed = useCallback(() => elapsedRef.current, [])

  return {
    status,
    hasAudio,
    error,
    analyser,
    getElapsed,
    start,
    pause,
    resume,
    stop,
    discard,
  }
}
