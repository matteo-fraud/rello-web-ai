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
    this.hasLoadedTrack = false
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

    this.nowPlayingEl = document.getElementById('now-playing')
    this.nowPlayingIconEl = document.getElementById('now-playing-icon')
    this.nowPlayingTitleEl = document.getElementById('now-playing-title')
    this.nowPlayingEl.addEventListener('click', () => this.open(this.currentIndex, { autoplay: false }))

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
      this._syncNowPlaying()
    })
    this.audio.addEventListener('pause', () => {
      this.playBtn.textContent = '▶'
      this.discEl.classList.remove('playing')
      this._syncNowPlaying()
    })
    this.audio.addEventListener('ended', () => {
      this.playBtn.textContent = '▶'
      this.discEl.classList.remove('playing')
      this._syncNowPlaying()
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
    this.hasLoadedTrack = true
    const track = this.tracks[index]
    this.discEl.style.setProperty('--disc-color', track.color)
    this.numberEl.textContent = `Track ${index + 1} / ${this.tracks.length} · ${album.title}`
    this.titleEl.textContent = track.title
    this.descEl.textContent = track.description
    this.durTimeEl.textContent = track.duration
    this.seekEl.value = 0
    this.curTimeEl.textContent = '0:00'
    this.nowPlayingTitleEl.textContent = track.title

    if (this.audio.src !== new URL(track.src, window.location.href).href) {
      this.audio.src = track.src
    }
    this.audio.currentTime = 0
  }

  // Reflects current playback state in the persistent "now playing" pill,
  // and only shows it once a track has actually been loaded, and while the
  // full panel isn't already open (would be redundant).
  _syncNowPlaying() {
    this.nowPlayingIconEl.textContent = this.audio.paused ? '▶' : '⏸'
    const shouldShow = this.hasLoadedTrack && !this.isOpen
    this.nowPlayingEl.classList.toggle('hidden', !shouldShow)
  }

  // Opens the full player panel (used from the tracklist, or Prev/Next).
  open(index, { autoplay = true } = {}) {
    this._loadTrack(index)
    this.panel.classList.remove('hidden')
    this._syncNowPlaying()
    if (autoplay) {
      this.audio.play().catch(() => {})
    }
  }

  // Starts a track playing without showing the panel — used when a record
  // is dug up, so exploring the desert isn't interrupted by a popup.
  playInBackground(index) {
    this._loadTrack(index)
    this.audio.play().catch(() => {})
    this._syncNowPlaying()
  }

  step(delta) {
    const next = (this.currentIndex + delta + this.tracks.length) % this.tracks.length
    this.open(next)
  }

  togglePlay() {
    if (this.audio.paused) this.audio.play().catch(() => {})
    else this.audio.pause()
  }

  // Closing the panel does NOT stop playback — the song keeps going in the
  // background, and the "now playing" pill reappears so it can be reopened.
  close() {
    this.panel.classList.add('hidden')
    this._syncNowPlaying()
  }
}
