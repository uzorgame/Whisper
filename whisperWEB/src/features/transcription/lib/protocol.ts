import type {
  ComputeDevice,
  ModelId,
  TranscriptSegment,
} from '../model/types'

/** main thread → worker */
export type WorkerRequest = {
  type: 'transcribe'
  pcm: Float32Array
  model: ModelId
  device: ComputeDevice
  language: string
}

/** worker → main thread */
export type WorkerResponse =
  | { type: 'stage'; stage: 'loading-model' | 'transcribing' }
  | {
      type: 'download'
      file: string
      progress: number
      loaded: number
      total: number
    }
  | { type: 'model-ready' }
  | {
      type: 'done'
      segments: TranscriptSegment[]
      text: string
      elapsed: number
      model: ModelId
      device: ComputeDevice
    }
  | { type: 'failed'; message: string }
