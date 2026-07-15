// All sound effects are synthesized at runtime with the Web Audio API —
// no SFX asset files needed. Music playback (the actual tracks) uses plain
// <audio> elements instead, wired up in ui/trackPanel.js.
export class Sfx {
  constructor() {
    this.ctx = null
    this.master = null
    this.noiseBuffer = null
    this.windSource = null
    this.muted = false
  }

  // Must be called from within a user-gesture handler (autoplay policy).
  unlock() {
    if (this.ctx) return
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    this.ctx = new AudioCtx()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.6
    this.master.connect(this.ctx.destination)
    this.noiseBuffer = this._makeNoiseBuffer(2)
    this._startWind()
  }

  setMuted(muted) {
    this.muted = muted
    if (this.master) this.master.gain.value = muted ? 0 : 0.6
  }

  _makeNoiseBuffer(seconds) {
    const ctx = this.ctx
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  _startWind() {
    const ctx = this.ctx
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 400
    filter.Q.value = 0.6
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 180
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    const gain = ctx.createGain()
    gain.gain.value = 0.05
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start()
    lfo.start()
    this.windSource = src
  }

  footstep() {
    if (!this.ctx) return
    const ctx = this.ctx
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900 + Math.random() * 400
    const gain = ctx.createGain()
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start(now)
    src.stop(now + 0.15)
  }

  dig() {
    if (!this.ctx) return
    const ctx = this.ctx
    const now = ctx.currentTime

    // low thud
    const thud = ctx.createBufferSource()
    thud.buffer = this.noiseBuffer
    const thudFilter = ctx.createBiquadFilter()
    thudFilter.type = 'lowpass'
    thudFilter.frequency.value = 300
    const thudGain = ctx.createGain()
    thudGain.gain.setValueAtTime(0.5, now)
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    thud.connect(thudFilter)
    thudFilter.connect(thudGain)
    thudGain.connect(this.master)
    thud.start(now)
    thud.stop(now + 0.3)

    // rising shimmer
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.4)
    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0.0001, now)
    oscGain.gain.linearRampToValueAtTime(0.18, now + 0.05)
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
    osc.connect(oscGain)
    oscGain.connect(this.master)
    osc.start(now)
    osc.stop(now + 0.5)
  }

  uiBlip() {
    if (!this.ctx) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 660
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(now)
    osc.stop(now + 0.12)
  }
}
