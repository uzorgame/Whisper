import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { Select } from '../../../shared/ui/Select'
import { MicIcon, PauseIcon, PlayIcon } from '../../../shared/ui/icons'
import { LANGUAGES } from '../../transcription/model/languages'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { WaveformVisualizer } from './WaveformVisualizer'
import styles from './RecordingModal.module.css'

interface Props {
  language: string
  onLanguageChange: (language: string) => void
  onClose: () => void
  /** hands the captured take back to the transcription feature */
  onCapture: (file: File) => void
}

/** Mounted only while the dialog is open, so every take starts from scratch. */
export function RecordingModal({
  language,
  onLanguageChange,
  onClose,
  onCapture,
}: Props) {
  const recorder = useAudioRecorder()
  const isLive = recorder.status === 'recording'
  // 'stopped' means the stream is gone: the only sane action left is a new take
  const canStartFresh = recorder.status === 'idle' || recorder.status === 'stopped'

  async function handleTranscribe() {
    const file = await recorder.stop()
    // no file means the stream was already gone — never close silently on that
    if (!file) return
    onCapture(file)
    onClose()
  }

  function handleClose() {
    recorder.discard()
    onClose()
  }

  return (
    <Modal
      open
      title="New Transcription"
      description="Pick the language first, then record. Audio stays on this device."
      onClose={handleClose}
    >
      <WaveformVisualizer
        analyser={recorder.analyser}
        status={recorder.status}
        getElapsed={recorder.getElapsed}
      />

      {recorder.error && <Alert>{recorder.error}</Alert>}

      <Select
        label="Audio language"
        value={language}
        onChange={onLanguageChange}
        // the language is baked into the run, so it is locked once audio exists
        disabled={!canStartFresh}
        hint={
          canStartFresh
            ? 'Naming the language explicitly beats auto-detect.'
            : 'Locked while a take is in progress.'
        }
        options={LANGUAGES.map((item) => ({
          value: item.code,
          label: item.label,
        }))}
      />

      <div className={styles.actions}>
        {canStartFresh ? (
          <Button
            className={styles.primary}
            variant="primary"
            size="lg"
            onClick={() => void recorder.start()}
          >
            <MicIcon />
            {recorder.status === 'stopped' ? 'Record again' : 'Start recording'}
          </Button>
        ) : (
          <Button
            className={styles.primary}
            variant="primary"
            size="lg"
            disabled={!recorder.hasAudio}
            onClick={() => void handleTranscribe()}
          >
            Stop &amp; transcribe
          </Button>
        )}

        {/* pause/resume only exist while a live stream does */}
        {!canStartFresh && (
          <div className={styles.secondary}>
            {isLive ? (
              <Button variant="ghost" onClick={recorder.pause}>
                <PauseIcon />
                Pause recording
              </Button>
            ) : (
              <Button variant="ghost" onClick={recorder.resume}>
                <PlayIcon />
                Resume
              </Button>
            )}
          </div>
        )}

        {!canStartFresh && !recorder.hasAudio && !recorder.error && (
          <p className={styles.hint}>Say something to enable transcription.</p>
        )}
      </div>
    </Modal>
  )
}
