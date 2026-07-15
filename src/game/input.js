const FORWARD_KEYS = new Set(['ArrowUp', 'KeyW'])
const BACK_KEYS = new Set(['ArrowDown', 'KeyS'])
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA'])
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD'])
const INTERACT_KEYS = new Set(['KeyE', 'Space', 'Enter'])

export class Input {
  constructor() {
    this.forward = false
    this.back = false
    this.left = false
    this.right = false
    this.interactPressed = false // edge-triggered, consumed by Game each frame
    this.anyInputThisSession = false

    this._onKeyDown = (e) => {
      if (FORWARD_KEYS.has(e.code)) this.forward = true
      if (BACK_KEYS.has(e.code)) this.back = true
      if (LEFT_KEYS.has(e.code)) this.left = true
      if (RIGHT_KEYS.has(e.code)) this.right = true
      if (INTERACT_KEYS.has(e.code)) {
        if (!e.repeat) this.interactPressed = true
        e.preventDefault()
      }
      this.anyInputThisSession = true
    }
    this._onKeyUp = (e) => {
      if (FORWARD_KEYS.has(e.code)) this.forward = false
      if (BACK_KEYS.has(e.code)) this.back = false
      if (LEFT_KEYS.has(e.code)) this.left = false
      if (RIGHT_KEYS.has(e.code)) this.right = false
    }

    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)

    this._bindTouchButton('touch-forward', 'forward')
    this._bindTouchButton('touch-left', 'left')
    this._bindTouchButton('touch-right', 'right')
    const interactBtn = document.getElementById('touch-interact')
    if (interactBtn) {
      const fire = (e) => {
        e.preventDefault()
        this.interactPressed = true
        this.anyInputThisSession = true
      }
      interactBtn.addEventListener('pointerdown', fire)
    }
  }

  _bindTouchButton(id, prop) {
    const el = document.getElementById(id)
    if (!el) return
    const down = (e) => {
      e.preventDefault()
      this[prop] = true
      this.anyInputThisSession = true
    }
    const up = (e) => {
      e.preventDefault()
      this[prop] = false
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', up)
    el.addEventListener('pointercancel', up)
  }

  // Call once per frame after the game has read+acted on interactPressed.
  consumeInteract() {
    const was = this.interactPressed
    this.interactPressed = false
    return was
  }
}
