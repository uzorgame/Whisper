import { useState } from 'react'
import { Alert } from '../../../shared/ui/Alert'
import { Panel, PanelSection } from '../../../shared/ui/Panel'
import { detectDefaultDevice } from '../../../shared/lib/device'
import { RecordingModal } from '../../recording/components/RecordingModal'
import { useMediaFile } from '../hooks/useMediaFile'
import { useTranscriber } from '../hooks/useTranscriber'
import { DEFAULT_LANGUAGE } from '../model/languages'
import { DEFAULT_MODEL, bestModelFor } from '../model/models'
import type { ComputeDevice, ModelId } from '../model/types'
import { EngineControls } from './EngineControls'
import { FileDropzone } from './FileDropzone'
import { ProgressPanel } from './ProgressPanel'
import { RunBar } from './RunBar'
import { TranscriptPanel } from './TranscriptPanel'
import styles from './TranscriptionWorkbench.module.css'

/**
 * Feature root: owns only the run configuration and wires the pieces together.
 * File handling lives in useMediaFile, inference in useTranscriber, capture in
 * the recording feature.
 */
export function TranscriptionWorkbench() {
  const [device, setDevice] = useState<ComputeDevice>(detectDefaultDevice)
  // the default model needs a GPU, so on a CPU-only machine it steps down
  const [model, setModel] = useState<ModelId>(() =>
    bestModelFor(DEFAULT_MODEL, detectDefaultDevice() === 'webgpu'),
  )
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE)
  const [isRecorderOpen, setRecorderOpen] = useState(false)

  const media = useMediaFile()
  const transcriber = useTranscriber()

  function handleSelect(file: File) {
    transcriber.reset()
    void media.select(file)
  }

  function handleClear() {
    transcriber.reset()
    media.clear()
  }

  /** Switching to CPU has to move the model too, or the run fails on submit. */
  function handleDeviceChange(next: ComputeDevice) {
    setDevice(next)
    setModel((current) => bestModelFor(current, next === 'webgpu'))
  }

  function handleRun() {
    if (!media.file) return
    void transcriber.transcribe({ file: media.file, model, device, language })
  }

  /** A finished take goes straight to transcription — that is the whole point. */
  function handleCapture(file: File) {
    transcriber.reset()
    void media.select(file)
    void transcriber.transcribe({ file, model, device, language })
  }

  return (
    <div className={styles.workbench}>
      <Panel>
        <PanelSection>
          <FileDropzone
            file={media.file}
            duration={media.duration}
            disabled={transcriber.isBusy}
            onSelect={handleSelect}
            onClear={handleClear}
            onRecord={() => setRecorderOpen(true)}
          />
        </PanelSection>

        <PanelSection>
          <EngineControls
            model={model}
            language={language}
            device={device}
            disabled={transcriber.isBusy}
            onModelChange={setModel}
            onLanguageChange={setLanguage}
            onDeviceChange={handleDeviceChange}
          />
        </PanelSection>

        <PanelSection tone="muted">
          <RunBar
            canRun={media.file !== null}
            isBusy={transcriber.isBusy}
            onRun={handleRun}
            onCancel={transcriber.cancel}
          />
        </PanelSection>

        {transcriber.isBusy && (
          <PanelSection>
            <ProgressPanel
              stage={transcriber.stage}
              downloads={transcriber.downloads}
            />
          </PanelSection>
        )}
      </Panel>

      {transcriber.error && <Alert>{transcriber.error}</Alert>}

      {transcriber.result && media.file && (
        <TranscriptPanel
          result={transcriber.result}
          sourceName={media.file.name}
        />
      )}

      {/* mounted only while open: the recorder hook owns a MediaRecorder and a
          status, and keeping those alive between takes left the dialog showing
          Resume / Stop for a stream that had already been torn down */}
      {isRecorderOpen && (
        <RecordingModal
          language={language}
          onLanguageChange={setLanguage}
          onClose={() => setRecorderOpen(false)}
          onCapture={handleCapture}
        />
      )}
    </div>
  )
}
