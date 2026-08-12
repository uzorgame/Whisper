# Scriptor

Speech transcription that runs entirely inside the browser. OpenAI's Whisper
executes on the visitor's own GPU through WebGPU — there is no upload step, no
queue and no backend, because there is no server at all.

**Live:** https://uz-or.com/scriptor/

```
scriptor/
├─ scriptorWEB/   Vite + React + TypeScript — the web app
└─ scriptorWIN/   reserved for a Tauri desktop build
```

## What it does

- Drop an audio or video file, or record straight from the microphone
- Three model sizes, ten languages plus auto-detect, GPU or CPU backend
- Export to PDF, DOCX, TXT, SRT and VTT
- Nothing leaves the device at any point

## Measured performance

19 seconds of speech, WebGPU, weights already cached. Realtime is audio length
divided by compute time — higher is faster.

| Model | Download | Compute | Realtime |
|-------|----------|---------|----------|
| Base | 197 MB | 3.3 s | 5.8× |
| Small | 391 MB | 3.9 s | 4.9× |
| Large v3 Turbo | 538 MB | 3.3 s | 5.7× |

On the CPU backend the same work runs roughly ten times slower, and Large is
unavailable there — its encoder alone would be 2.4 GB in the precision the CPU
backend can execute.

Large v3 Turbo is both the most accurate **and** the fastest of the three: its
decoder is only four layers deep, and the decoder is the part that runs
sequentially, token by token.

## Engineering notes

**Model precision is chosen per model.** An fp32 large-v3-turbo encoder exceeds
WebGPU buffer limits and shows up as a load that reaches 100% and then hangs
forever. Turbo runs at `q4f16` (538 MB); the smaller models keep a higher
precision encoder because quantising the encoder is what costs accuracy, and at
under 200 MB there is nothing to gain by shrinking it.

**Weights live in IndexedDB, not Cache Storage.** Chrome silently refuses to
persist single Cache Storage entries past a few hundred megabytes — measured
here, the 185 MB turbo decoder was kept and the 353 MB encoder was not. The
effect was a several-hundred-megabyte re-download on *every* run. Swapping in an
IndexedDB-backed cache took a repeat Turbo run from 143 s to 12 s.

**Decoding is greedy, and that is not a choice.** transformers.js accepts a
`num_beams` argument, but its generation loop keeps only the first candidate and
breaks (`modeling_utils.js` — "TODO: Support beam search"). Beam search would
cost time and change nothing, so the option is not offered.

**The CPU backend needs different quantisation.** `q8` maps to the `_quantized`
QDQ files, and onnxruntime-web cannot build a session from the Whisper decoder in
that form — it fails inside `TransposeDQWeightsForMatMulNBits`. The q4 decoders
already contain those nodes, so no rewrite is attempted and the session builds.

## Running locally

```bash
cd scriptorWEB
npm install
npm run dev
```

## Stack

Vite · React · TypeScript · transformers.js · ONNX Runtime Web · Lenis · pdfmake · docx

## Licence

The Whisper model is OpenAI's, under MIT.
