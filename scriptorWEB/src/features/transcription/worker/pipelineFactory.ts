import { pipeline, env } from '@huggingface/transformers'
import type { ComputeDevice, ModelId } from '../model/types'
import { indexedDbCache } from './modelCache'

// weights come from the HF CDN; IndexedDB keeps them because Cache Storage
// silently drops the largest file of the bigger models
env.allowLocalModels = false
env.useCustomCache = true
env.customCache = indexedDbCache

/* eslint-disable @typescript-eslint/no-explicit-any */
type Transcriber = any

export interface DownloadUpdate {
  file: string
  progress: number
  loaded: number
  total: number
}

export type DownloadReporter = (update: DownloadUpdate) => void

/**
 * Precision is picked per model against the real file sizes on the CDN.
 *
 * The small models keep an fp32/fp16 encoder because quantising the encoder is
 * what costs accuracy, and at 31–168 MB there is nothing to gain. Turbo is a
 * different story: its fp16 encoder alone is 1215 MB, which is both a painful
 * download and too large for the browser to keep in Cache Storage — so it gets
 * re-fetched on every run. q4f16 brings the pair down to 538 MB, which caches.
 */
const WEBGPU_DTYPE: Record<ModelId, Record<string, string>> = {
  'onnx-community/whisper-base': {
    encoder_model: 'fp32',
    decoder_model_merged: 'q4',
  },
  'onnx-community/whisper-small': {
    encoder_model: 'fp16',
    decoder_model_merged: 'q4',
  },
  'onnx-community/whisper-large-v3-turbo': {
    encoder_model: 'q4f16',
    decoder_model_merged: 'q4f16',
  },
}

/**
 * The CPU backend needs its own table. `q8` maps to the `_quantized` QDQ files,
 * and onnxruntime-web cannot build a session from the whisper decoder in that
 * form — it dies in TransposeDQWeightsForMatMulNBits looking for a scale that
 * the QDQ graph does not carry. The q4 decoders already contain MatMulNBits
 * nodes, so no rewrite is attempted and the session builds.
 */
const WASM_DTYPE: Record<ModelId, Record<string, string>> = {
  'onnx-community/whisper-base': {
    encoder_model: 'fp32',
    decoder_model_merged: 'q4',
  },
  'onnx-community/whisper-small': {
    encoder_model: 'fp32',
    decoder_model_merged: 'q4',
  },
  'onnx-community/whisper-large-v3-turbo': {
    encoder_model: 'fp32',
    decoder_model_merged: 'q4',
  },
}

function dtypeFor(model: ModelId, device: ComputeDevice) {
  return device === 'webgpu' ? WEBGPU_DTYPE[model] : WASM_DTYPE[model]
}

let cached: Transcriber = null
let cacheKey = ''

/** Keeps one warm pipeline around so repeat runs skip the load entirely. */
export async function loadTranscriber(
  model: ModelId,
  device: ComputeDevice,
  onDownload: DownloadReporter,
): Promise<{ transcriber: Transcriber; wasCached: boolean }> {
  // turbo on CPU means a 2.4 GB fp32 encoder and minutes of inference — refuse
  // loudly instead of letting it look like a hang
  if (model === 'onnx-community/whisper-large-v3-turbo' && device === 'wasm') {
    throw new Error(
      'Large v3 Turbo needs WebGPU. On the CPU backend it would download a 2.4 GB encoder and run far slower than real time — pick Small or switch Compute to WebGPU.',
    )
  }

  const key = `${model}::${device}`
  if (cached && cacheKey === key) {
    return { transcriber: cached, wasCached: true }
  }

  if (cached) {
    await cached.dispose?.()
    cached = null
    cacheKey = ''
  }

  cached = await pipeline('automatic-speech-recognition', model, {
    device,
    dtype: dtypeFor(model, device) as any,
    progress_callback: (event: any) => {
      if (event.status === 'progress' && event.file) {
        onDownload({
          file: event.file,
          progress: typeof event.progress === 'number' ? event.progress : 0,
          loaded: typeof event.loaded === 'number' ? event.loaded : 0,
          total: typeof event.total === 'number' ? event.total : 0,
        })
      }
    },
  })

  cacheKey = key
  return { transcriber: cached, wasCached: false }
}
