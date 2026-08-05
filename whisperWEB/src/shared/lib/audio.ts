/** Whisper only ever consumes mono PCM at 16 kHz. */
export const TARGET_SAMPLE_RATE = 16000

export interface DecodedAudio {
  pcm: Float32Array
  duration: number
}

export class AudioDecodeError extends Error {
  constructor() {
    super(
      'Could not read an audio track from this file. The browser does not support this container or codec — try mp3, wav, m4a or ogg.',
    )
    this.name = 'AudioDecodeError'
  }
}

/**
 * Decodes any browser-supported media file straight into the sample rate the
 * model needs — AudioContext handles resampling, so no extra dependency.
 */
export async function decodeAudioFile(file: File): Promise<DecodedAudio> {
  const bytes = await file.arrayBuffer()
  const context = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE })

  try {
    const buffer = await context.decodeAudioData(bytes)
    const pcm =
      buffer.numberOfChannels === 1 ? buffer.getChannelData(0) : mixToMono(buffer)

    return { pcm, duration: buffer.duration }
  } catch (error) {
    if (error instanceof AudioDecodeError) throw error
    throw new AudioDecodeError()
  } finally {
    await context.close()
  }
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
    buffer.getChannelData(index),
  )

  const mixed = new Float32Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    let sum = 0
    for (const channel of channels) sum += channel[i]
    mixed[i] = sum / channels.length
  }

  return mixed
}
