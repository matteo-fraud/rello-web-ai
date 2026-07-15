export class Hud {
  constructor({ totalTracks, sfx, onAbout, onTracklist }) {
    this.totalTracks = totalTracks
    this.sfx = sfx
    this.root = document.getElementById('hud')
    this.progressEl = document.getElementById('hud-progress')
    this.hintEl = document.getElementById('controls-hint')
    this.muteBtn = document.getElementById('mute-btn')
    this.muted = false

    document.getElementById('about-btn').addEventListener('click', () => {
      this.sfx.uiBlip()
      onAbout()
    })
    document.getElementById('tracklist-btn').addEventListener('click', () => {
      this.sfx.uiBlip()
      onTracklist()
    })
    this.muteBtn.addEventListener('click', () => {
      this.muted = !this.muted
      this.sfx.setMuted(this.muted)
      this.muteBtn.textContent = this.muted ? '🔇' : '🔊'
    })
  }

  show() {
    this.root.classList.remove('hidden')
    this.hintEl.classList.remove('hidden')
    const touchControls = document.getElementById('touch-controls')
    if (window.matchMedia('(pointer: coarse)').matches) {
      touchControls.classList.remove('hidden')
    }
  }

  fadeHint() {
    this.hintEl.style.opacity = '0'
  }

  setUnearthedCount(count) {
    this.progressEl.textContent = `${count} / ${this.totalTracks} unearthed`
  }
}
