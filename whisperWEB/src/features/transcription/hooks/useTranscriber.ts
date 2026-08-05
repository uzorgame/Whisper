import { useCallback, useEffect, useRef, useState } from 'react'
import { decodeAudioFile } from '../../../shared/lib/audio'
import type { WorkerRequest, WorkerResponse } from '../lib/protocol'
import type {
  ComputeDevice,
  ModelDownload,
  ModelId,
  TranscriptionResult,
  TranscriptionStage,
} from '../model/types'

export interface TranscribeOptions {
  file: File
  model: ModelId
  device: ComputeDevice
  language: string
}

export interface TranscriberState {
  stage: TranscriptionStage
  downloads: ModelDownload[]
  result: TranscriptionResult | null
  error: string | null
  isBusy: boolean
  transcribe: (options: TranscribeOptions) => Promise<void>
  cancel: () => void
  reset: () => void
}

function createWorker(): Worker {
  return new Worker(new URL('../worker/whisper.worker.ts', import.meta.url), {
    type: 'module',
  })
}

export function useTranscriber(): TranscriberState {
  const [stage, setStage] = useState<TranscriptionStage>('idle')
  const [downloads, setDownloads] = useState<ModelDownload[]>([])
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const workerRef = useRef<Worker | null>(null)
  // the worker answers asynchronously, so the duration has to survive outside state
  const durationRef = useRef(0)

  const handleMessage = useCallback((event: MessageEvent<WorkerResponse>) => {
    const message = event.data

    switch (message.type) {
      case 'stage':
        setStage(message.stage)
        break

      case 'download':
        setDownloads((current) => {
          const next = current.filter((item) => item.file !== message.file)
          next.push({
            file: message.file,
            progress: message.progress,
            loaded: message.loaded,
            total: message.total,
          })
          return next
        })
        break

      case 'model-ready':
        setDownloads([])
        break

      case 'done':
        setResult({
          segments: message.segments,
          text: message.text,
          elapsed: message.elapsed,
          model: message.model,
          device: message.device,
          duration: durationRef.current,
        })
        setStage('idle')
        setDownloads([])
        break

      case 'failed':
        setError(message.message)
        setStage('idle')
        setDownloads([])
        break
    }
  }, [])

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current

    const worker = createWorker()
    worker.addEventListener('message', handleMessage)
    workerRef.current = worker
    return worker
  }, [handleMessage])

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const transcribe = useCallback(
    async ({ file, model, device, language }: TranscribeOptions) => {
      setError(null)
      setResult(null)
      setStage('decoding')

      try {
        const { pcm, duration } = await decodeAudioFile(file)
        durationRef.current = duration

        const request: WorkerRequest = {
          type: 'transcribe',
          pcm,
          model,
          device,
          language,
        }

        // hand the sample buffer over instead of cloning a multi-MB array
        ensureWorker().postMessage(request, [pcm.buffer])
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
        setStage('idle')
      }
    },
    [ensureWorker],
  )

  const cancel = useCallback(() => {
    // there is no cooperative abort inside the pipeline — dropping the worker is it
    workerRef.current?.terminate()
    workerRef.current = null
    setStage('idle')
    setDownloads([])
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    stage,
    downloads,
    result,
    error,
    isBusy: stage !== 'idle',
    transcribe,
    cancel,
    reset,
  }
}
