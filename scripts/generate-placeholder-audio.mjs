// Generates short synthesized WAV tones so the desert has something to play
// before real masters are dropped into public/audio. Safe to re-run any time:
//   node scripts/generate-placeholder-audio.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tracks } from '../src/data/tracks.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'audio')
mkdirSync(outDir, { recursive: true })

const SAMPLE_RATE = 44100

// A little chord progression per track index so each buried record sounds
// distinct instead of one repeated tone. Purely a demo placeholder.
const PROGRESSIONS = [
  [220.0, 277.18, 329.63], // A minor-ish
  [246.94, 311.13, 369.99],
  [196.0, 246.94, 293.66],
  [164.81, 207.65, 246.94],
  [174.61, 220.0, 261.63],
  [220.0, 261.63, 329.63],
  [196.0, 233.08, 293.66],
  [146.83, 185.0, 220.0],
]

function synth(freqs, seconds) {
  const total = Math.floor(SAMPLE_RATE * seconds)
  const data = new Float32Array(total)
  const noteLen = total / freqs.length
  for (let i = 0; i < total; i++) {
    const noteIdx = Math.min(freqs.length - 1, Math.floor(i / noteLen))
    const f = freqs[noteIdx]
    const t = i / SAMPLE_RATE
    // Soft plucked-string-ish tone: fundamental + a couple of harmonics, exponential decay per note.
    const noteT = (i % noteLen) / SAMPLE_RATE
    const decay = Math.exp(-noteT * 1.6)
    let s =
      Math.sin(2 * Math.PI * f * t) * 0.6 +
      Math.sin(2 * Math.PI * f * 2 * t) * 0.25 +
      Math.sin(2 * Math.PI * f * 3 * t) * 0.1
    s *= decay
    // gentle overall fade in/out to avoid clicks
    const fade = Math.min(1, i / 800, (total - i) / 800)
    data[i] = s * 0.5 * fade
  }
  return data
}

function encodeWav(samples) {
  const bytesPerSample = 2
  const blockAlign = bytesPerSample
  const buffer = Buffer.alloc(44 + samples.length * bytesPerSample)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + samples.length * bytesPerSample, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * blockAlign, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(samples.length * bytesPerSample, 40)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(clamped * 32767), offset)
    offset += bytesPerSample
  }
  return buffer
}

tracks.forEach((track, i) => {
  const freqs = PROGRESSIONS[i % PROGRESSIONS.length]
  const samples = synth(freqs, 6) // 6s placeholder loop, well under real track length
  const wav = encodeWav(samples)
  const filename = `track-${String(i + 1).padStart(2, '0')}.wav`
  writeFileSync(join(outDir, filename), wav)
  console.log(`wrote public/audio/${filename} (${track.title})`)
})
