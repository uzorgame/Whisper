import type { ModelId } from './types'

export interface WhisperModelInfo {
  id: ModelId
  label: string
  /** measured download size of the weights this app actually requests */
  size: string
  hint: string
  /** the CPU backend cannot run this at a usable speed */
  requiresWebGPU?: boolean
}

/**
 * Sizes are the real Content-Length of the encoder + decoder files pulled from
 * the HF CDN for the precision this app requests — not the parameter counts
 * quoted on model cards, which are far smaller than what a browser downloads.
 */
export const WHISPER_MODELS: WhisperModelInfo[] = [
  {
    id: 'onnx-community/whisper-base',
    label: 'Base',
    size: '197 MB',
    hint: 'Smallest download. Handles clear speech, drops accuracy on accents and noise.',
  },
  {
    id: 'onnx-community/whisper-small',
    label: 'Small',
    size: '391 MB',
    hint: 'Middle ground. Better than Base, still misses word endings.',
  },
  {
    id: 'onnx-community/whisper-large-v3-turbo',
    label: 'Large v3 Turbo',
    size: '538 MB',
    // measured: 4.5× realtime against Small's 3.1× — its decoder is only
    // 4 layers deep, and the decoder is what runs token by token
    hint: 'Best accuracy and the fastest of the three. Needs a GPU.',
    requiresWebGPU: true,
  },
]

export const DEFAULT_MODEL: ModelId = 'onnx-community/whisper-base'

/** Falls back to the best model the given backend can actually run. */
export function bestModelFor(
  model: ModelId,
  webgpu: boolean,
): ModelId {
  if (webgpu) return model
  return getModelInfo(model).requiresWebGPU
    ? 'onnx-community/whisper-small'
    : model
}

export function getModelInfo(id: ModelId): WhisperModelInfo {
  const found = WHISPER_MODELS.find((model) => model.id === id)
  if (!found) throw new Error(`Unknown model: ${id}`)
  return found
}
