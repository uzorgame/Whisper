import { Select } from '../../../shared/ui/Select'
import { isWebGPUAvailable } from '../../../shared/lib/device'
import { LANGUAGES } from '../model/languages'
import { WHISPER_MODELS, getModelInfo } from '../model/models'
import type { ComputeDevice, ModelId } from '../model/types'
import styles from './EngineControls.module.css'

interface Props {
  model: ModelId
  language: string
  device: ComputeDevice
  disabled: boolean
  onModelChange: (model: ModelId) => void
  onLanguageChange: (language: string) => void
  onDeviceChange: (device: ComputeDevice) => void
}

const DEVICE_OPTIONS: { value: ComputeDevice; label: string; meta: string }[] = [
  { value: 'webgpu', label: 'WebGPU — graphics card', meta: 'fast' },
  { value: 'wasm', label: 'WASM — CPU', meta: 'fallback' },
]

const DEVICE_HINT: Record<ComputeDevice, string> = {
  webgpu:
    'Runs on your graphics card — roughly 10× faster and the only way to run Large.',
  wasm: 'Runs on the processor. Works anywhere, but Large is out of reach and long files get slow.',
}

export function EngineControls({
  model,
  language,
  device,
  disabled,
  onModelChange,
  onLanguageChange,
  onDeviceChange,
}: Props) {
  const webgpuAvailable = isWebGPUAvailable()
  const onGpu = device === 'webgpu'
  const modelInfo = getModelInfo(model)

  return (
    <div className={styles.grid}>
      <Select
        label="Model"
        value={model}
        disabled={disabled}
        onChange={onModelChange}
        hint={modelInfo.hint}
        options={WHISPER_MODELS.map((item) => {
          const blocked = item.requiresWebGPU && !onGpu
          return {
            value: item.id,
            label: item.label,
            meta: blocked ? 'needs WebGPU' : item.size,
            disabled: blocked,
          }
        })}
      />

      <Select
        label="Language"
        value={language}
        disabled={disabled}
        onChange={onLanguageChange}
        hint="Naming the language explicitly beats auto-detect."
        options={LANGUAGES.map((item) => ({
          value: item.code,
          label: item.label,
        }))}
      />

      <Select
        label="Compute"
        value={device}
        disabled={disabled || !webgpuAvailable}
        onChange={onDeviceChange}
        hint={
          webgpuAvailable
            ? DEVICE_HINT[device]
            : 'This browser has no WebGPU, so everything runs on the processor.'
        }
        options={DEVICE_OPTIONS.map((item) => ({
          ...item,
          disabled: item.value === 'webgpu' && !webgpuAvailable,
        }))}
      />
    </div>
  )
}
