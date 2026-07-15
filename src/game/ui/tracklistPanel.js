export class TracklistPanel {
  constructor({ tracks, onSelect, isUnearthed }) {
    this.tracks = tracks
    this.onSelect = onSelect
    this.isUnearthed = isUnearthed
    this.panel = document.getElementById('tracklist-panel')
    this.listEl = document.getElementById('tracklist-list')

    document.querySelectorAll('[data-close="tracklist-panel"]').forEach((el) =>
      el.addEventListener('click', () => this.close())
    )
  }

  get isOpen() {
    return !this.panel.classList.contains('hidden')
  }

  open() {
    this.listEl.innerHTML = ''
    const foundIndices = this.tracks.map((_, i) => i).filter((i) => this.isUnearthed(i))

    if (foundIndices.length === 0) {
      const empty = document.createElement('li')
      empty.className = 'tracklist-empty'
      empty.textContent = 'Nothing dug up yet — go explore the dunes.'
      this.listEl.appendChild(empty)
    } else {
      foundIndices.forEach((i) => {
        const track = this.tracks[i]
        const li = document.createElement('li')
        li.className = 'tracklist-item'
        li.innerHTML = `
          <span class="tracklist-dot" style="color:${track.color}; background:${track.color}"></span>
          <span class="tracklist-name">${i + 1}. ${track.title}</span>
          <span class="tracklist-status">${track.duration}</span>
        `
        li.addEventListener('click', () => {
          this.panel.classList.add('hidden')
          this.onSelect(i)
        })
        this.listEl.appendChild(li)
      })
    }
    this.panel.classList.remove('hidden')
  }

  close() {
    this.panel.classList.add('hidden')
  }
}
