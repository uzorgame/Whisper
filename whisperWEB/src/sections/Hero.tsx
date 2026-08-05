import { Tag } from '../shared/ui/Tag'
import styles from './Hero.module.css'

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.eyebrow}>
        <Tag tone="tint">Runs entirely in your browser</Tag>
      </div>

      <h1 className={styles.title}>
        Transcription that never leaves{' '}
        <span className={styles.accent}>your machine</span>
      </h1>

      <p className={styles.lead}>
        Whisper runs on your own GPU through WebGPU. There is no upload, no
        queue and no server — because there is no backend at all.
      </p>

      <div className={styles.badges}>
        <Tag>No sign-up</Tag>
        <Tag>No backend</Tag>
        <Tag>SRT · VTT · TXT</Tag>
        <Tag tone="primary">100% local</Tag>
      </div>
    </section>
  )
}
