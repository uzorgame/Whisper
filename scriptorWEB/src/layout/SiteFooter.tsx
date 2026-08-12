import { Container } from './Container'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.inner}>
          {/* Both credits stack on the left, so the right-hand side is free for
              the author card — the same card the other tools in the portfolio
              carry, which is what ties them together as one person's work. */}
          <div className={styles.credits}>
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

          <a
            className={styles.author}
            href="https://uz-or.com/"
            target="_blank"
            rel="noreferrer"
          >
            <span className={styles.authorIcon}>
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <rect width="64" height="64" fill="#0a0a0a" />
                <polygon
                  fill="#fff"
                  points="12,52 12,12 24,12 40,36 40,12 52,12 52,52 40,52 24,28 24,52"
                />
              </svg>
            </span>
            <span className={styles.authorText}>
              <b>Mykhailo Nahreba</b>
              <em>Author · see the portfolio</em>
            </span>
            <svg className={styles.authorArrow} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17 17 7M8.5 7H17v8.5" />
            </svg>
          </a>
        </div>
      </Container>
    </footer>
  )
}
