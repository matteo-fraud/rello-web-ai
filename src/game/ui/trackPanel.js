import { album } from '../../data/tracks.js'

function formatTime(sec) {
  if (!Number.isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export class TrackPanel {
  constructor({ tracks }) {
    this.tracks = tracks
    this.currentIndex = 0
    this.audio = new Audio()
    this.audio.preload = 'metadata'

    this.panel = document.getElementById('track-panel')
    this.discEl = document.getElementById('track-disc')
    this.numberEl = document.getElementById('track-number')
    this.titleEl = document.getElementById('track-title')
    this.descEl = document.getElementById('track-desc')
    this.playBtn = document.getElementById('play-btn')
    this.seekEl = document.getElementById('seek')
    this.curTimeEl = document.getElementById('time-current')
    this.durTimeEl = document.getElementById('time-duration')

    this.playBtn.addEventListener('click', () => this.togglePlay())
    document.getElementById('prev-track-btn').addEventListener('click', () => this.step(-1))
    document.getElementById('next-track-btn').addEventListener('click', () => this.step(1))
    this.seekEl.addEventListener('input', () => {
      if (this.audio.duration) this.audio.currentTime = (this.seekEl.value / 100) * this.audio.duration
    })

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio.duration) {
        this.seekEl.value = (this.audio.currentTime / this.audio.duration) * 100
      }
      this.curTimeEl.textContent = formatTime(this.audio.currentTime)
    })
    this.audio.addEventListener('loadedmetadata', () => {
      this.durTimeEl.textContent = formatTime(this.audio.duration)
    })
    this.audio.addEventListener('play', () => {
      this.playBtn.textContent = '⏸'
      this.discEl.classList.add('playing')
    })
    this.audio.addEventListener('pause', () => {
      this.playBtn.textContent = '▶'
      this.discEl.classList.remove('playing')
    })
    this.audio.addEventListener('ended', () => {
      this.playBtn.textContent = '▶'
      this.discEl.classList.remove('playing')
    })

    document.querySelectorAll('[data-close="track-panel"]').forEach((el) =>
      el.addEventListener('click', () => this.close())
    )
  }

  get isOpen() {
    return !this.panel.classList.contains('hidden')
  }

  _loadTrack(index) {
    this.currentIndex = index
    const track = this.tracks[index]
    this.discEl.style.setProperty('--disc-color', track.color)
    this.numberEl.textContent = `Track ${index + 1} / ${this.tracks.length} · ${album.title}`
    this.titleEl.textContent = track.title
    this.descEl.textContent = track.description
    this.durTimeEl.textContent = track.duration
    this.seekEl.value = 0
    this.curTimeEl.textContent = '0:00'

    if (this.audio.src !== new URL(track.src, window.location.href).href) {
      this.audio.src = track.src
    }
    this.audio.currentTime = 0
  }

  // Opens the full player panel (used from the tracklist, or Prev/Next).
  open(index, { autoplay = true } = {}) {
    this._loadTrack(index)
    this.panel.classList.remove('hidden')
    if (autoplay) {
      this.audio.play().catch(() => {})
    }
  }

  // Starts a track playing without showing the panel — used when a record
  // is dug up, so exploring the desert isn't interrupted by a popup.
  playInBackground(index) {
    this._loadTrack(index)
    this.audio.play().catch(() => {})
  }

  step(delta) {
    const next = (this.currentIndex + delta + this.tracks.length) % this.tracks.length
    this.open(next)
  }

  togglePlay() {
    if (this.audio.paused) this.audio.play().catch(() => {})
    else this.audio.pause()
  }

  close() {
    this.audio.pause()
    this.panel.classList.add('hidden')
  }
}
