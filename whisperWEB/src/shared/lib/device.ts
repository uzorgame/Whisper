import type { ComputeDevice } from '../../features/transcription/model/types'

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export function detectDefaultDevice(): ComputeDevice {
  return isWebGPUAvailable() ? 'webgpu' : 'wasm'
}
