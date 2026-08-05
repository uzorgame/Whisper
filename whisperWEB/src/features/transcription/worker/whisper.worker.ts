/// <reference lib="webworker" />
import type { WorkerRequest, WorkerResponse } from '../lib/protocol'
import { AUTO_LANGUAGE } from '../model/languages'
import type { TranscriptSegment } from '../model/types'
import { loadTranscriber } from './pipelineFactory'

/** Whisper's receptive field is 30s; overlap lets us stitch chunks cleanly. */
const CHUNK_LENGTH_S = 30
const STRIDE_LENGTH_S = 5

function reply(message: WorkerResponse) {
  self.postMessage(message)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toSegments(chunks: any[]): TranscriptSegment[] {
  return chunks
    .map((chunk) => ({
      start: chunk.timestamp?.[0] ?? 0,
      end: chunk.timestamp?.[1] ?? chunk.timestamp?.[0] ?? 0,
      text: String(chunk.text ?? '').trim(),
    }))
    .filter((segment) => segment.text.length > 0)
}

async function handle(request: WorkerRequest) {
  const { pcm, model, device, language } = request

  reply({ type: 'stage', stage: 'loading-model' })

  const { transcriber, wasCached } = await loadTranscriber(
    model,
    device,
    (update) => reply({ type: 'download', ...update }),
  )

  if (!wasCached) reply({ type: 'model-ready' })

  reply({ type: 'stage', stage: 'transcribing' })

  const startedAt = performance.now()
  const output = await transcriber(pcm, {
    chunk_length_s: CHUNK_LENGTH_S,
    stride_length_s: STRIDE_LENGTH_S,
    language: language === AUTO_LANGUAGE ? undefined : language,
    task: 'transcribe',
    return_timestamps: true,
    // Decoding is greedy and there is no alternative: transformers.js accepts
    // `num_beams` but its generation loop discards every candidate past the
    // first (modeling_utils.js — "TODO: Support beam search"), so asking for
    // beam search only burns time computing options it then throws away.
  })
  const elapsed = (performance.now() - startedAt) / 1000

  reply({
    type: 'done',
    segments: toSegments(output.chunks ?? []),
    text: String(output.text ?? '').trim(),
    elapsed,
    model,
    device,
  })
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  if (event.data?.type !== 'transcribe') return

  handle(event.data).catch((error: unknown) => {
    reply({
      type: 'failed',
      message: error instanceof Error ? error.message : String(error),
    })
  })
})
