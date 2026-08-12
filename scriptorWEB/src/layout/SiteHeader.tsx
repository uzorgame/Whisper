import { Tag } from '../shared/ui/Tag'
import { isWebGPUAvailable } from '../shared/lib/device'
import { Container } from './Container'
import styles from './SiteHeader.module.css'

export function SiteHeader() {
  const webgpu = isWebGPUAvailable()

  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.brand}>
            <span className={styles.mark} aria-hidden="true" />
            <span className={styles.wordmark}>Scriptor</span>
          </div>

          <nav className={styles.nav}>
            <Tag tone={webgpu ? 'primary' : 'neutral'}>
              {webgpu ? 'WebGPU ready' : 'CPU mode'}
            </Tag>
          </nav>
        </div>
      </Container>
    </header>
  )
}
