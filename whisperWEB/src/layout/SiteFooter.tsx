import { Container } from './Container'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.inner}>
          <span>
            Whisper model by OpenAI, running locally through{' '}
            <a
              className={styles.link}
              href="https://github.com/huggingface/transformers.js"
              target="_blank"
              rel="noreferrer"
            >
              transformers.js
            </a>
          </span>
          <span>No audio ever leaves this device.</span>
        </div>
      </Container>
    </footer>
  )
}
