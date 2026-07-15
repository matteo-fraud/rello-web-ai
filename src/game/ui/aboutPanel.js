export class AboutPanel {
  constructor({ artist }) {
    this.panel = document.getElementById('about-panel')
    document.getElementById('about-name').textContent = artist.name
    document.getElementById('about-tagline').textContent = artist.tagline
    document.getElementById('about-bio').textContent = artist.bio
    const socialsEl = document.getElementById('about-socials')
    artist.socials.forEach((s) => {
      const a = document.createElement('a')
      a.href = s.url
      a.textContent = s.label
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      socialsEl.appendChild(a)
    })

    document.querySelectorAll('[data-close="about-panel"]').forEach((el) =>
      el.addEventListener('click', () => this.close())
    )
  }

  get isOpen() {
    return !this.panel.classList.contains('hidden')
  }

  open() {
    this.panel.classList.remove('hidden')
  }

  close() {
    this.panel.classList.add('hidden')
  }
}
