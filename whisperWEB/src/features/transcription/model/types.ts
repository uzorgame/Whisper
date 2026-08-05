export type ComputeDevice = 'webgpu' | 'wasm'

export type ModelId =
  | 'onnx-community/whisper-base'
  | 'onnx-community/whisper-small'
  | 'onnx-community/whisper-large-v3-turbo'

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface TranscriptionResult {
  segments: TranscriptSegment[]
  text: string
  /** length of the source audio, seconds */
  duration: number
  /** wall-clock inference time, seconds */
  elapsed: number
  model: ModelId
  device: ComputeDevice
}

export interface TranscriptionRequest {
  pcm: Float32Array
  model: ModelId
  device: ComputeDevice
  /** ISO code, or 'auto' to let the model detect it */
  language: string
}

export type TranscriptionStage =
  | 'idle'
  | 'decoding'
  | 'loading-model'
  | 'transcribing'

export interface ModelDownload {
  file: string
  progress: number
  /** bytes — the only honest basis for an overall percentage */
  loaded: number
  total: number
}
