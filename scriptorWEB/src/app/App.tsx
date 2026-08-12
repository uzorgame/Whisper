import { useEffect } from 'react'
import { requestPersistentStorage } from '../shared/lib/storage'
import { TranscriptionWorkbench } from '../features/transcription/components/TranscriptionWorkbench'
import { Container } from '../layout/Container'
import { SiteFooter } from '../layout/SiteFooter'
import { SiteHeader } from '../layout/SiteHeader'
import { Hero } from '../sections/Hero'
import { useSmoothScroll } from './useSmoothScroll'
import styles from './App.module.css'

export function App() {
  useSmoothScroll()

  // keeps downloaded weights from being evicted between visits
  useEffect(() => {
    void requestPersistentStorage()
  }, [])

  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <Container>
          <Hero />
          <TranscriptionWorkbench />
        </Container>
      </main>

      <SiteFooter />
    </div>
  )
}
