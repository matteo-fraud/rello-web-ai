const FORWARD_KEYS = new Set(['ArrowUp', 'KeyW'])
const BACK_KEYS = new Set(['ArrowDown', 'KeyS'])
const STRAFE_LEFT_KEYS = new Set(['ArrowLeft', 'KeyA'])
const STRAFE_RIGHT_KEYS = new Set(['ArrowRight', 'KeyD'])
const INTERACT_KEYS = new Set(['KeyE', 'Space', 'Enter'])

// Desktop: WASD moves relative to the camera, the mouse looks around
// (pointer-lock), like a console third-person game. Touch has no mouse, so
// it keeps a simple turn-left/forward/turn-right dpad instead.
export class Input {
  constructor(canvas) {
    this.canvas = canvas
    this.forward = false
    this.back = false
    this.strafeLeft = false
    this.strafeRight = false
    this.turnLeft = false // touch-only
    this.turnRight = false // touch-only
    this.interactPressed = false // edge-triggered, consumed by Game each frame
    this.anyInputThisSession = false
    this.mouseDX = 0
    this.mouseDY = 0
    this.pointerLocked = false

    this._onKeyDown = (e) => {
      if (FORWARD_KEYS.has(e.code)) this.forward = true
      if (BACK_KEYS.has(e.code)) this.back = true
      if (STRAFE_LEFT_KEYS.has(e.code)) this.strafeLeft = true
      if (STRAFE_RIGHT_KEYS.has(e.code)) this.strafeRight = true
      if (INTERACT_KEYS.has(e.code)) {
        if (!e.repeat) this.interactPressed = true
        e.preventDefault()
      }
      this.anyInputThisSession = true
    }
    this._onKeyUp = (e) => {
      if (FORWARD_KEYS.has(e.code)) this.forward = false
      if (BACK_KEYS.has(e.code)) this.back = false
      if (STRAFE_LEFT_KEYS.has(e.code)) this.strafeLeft = false
      if (STRAFE_RIGHT_KEYS.has(e.code)) this.strafeRight = false
    }

    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)

    this._bindTouchButton('touch-forward', 'forward')
    this._bindTouchButton('touch-left', 'turnLeft')
    this._bindTouchButton('touch-right', 'turnRight')
    const interactBtn = document.getElementById('touch-interact')
    if (interactBtn) {
      const fire = (e) => {
        e.preventDefault()
        this.interactPressed = true
        this.anyInputThisSession = true
      }
      interactBtn.addEventListener('pointerdown', fire)
    }

    if (canvas) {
      canvas.addEventListener('click', () => {
        if (document.pointerLockElement !== canvas) canvas.requestPointerLock()
      })
      document.addEventListener('pointerlockchange', () => {
        this.pointerLocked = document.pointerLockElement === canvas
      })
      document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement !== canvas) return
        this.mouseDX += e.movementX || 0
        this.mouseDY += e.movementY || 0
        this.anyInputThisSession = true
      })
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

  // Call once per frame; returns accumulated mouse movement since the last call.
  consumeMouseDelta() {
    const dx = this.mouseDX
    const dy = this.mouseDY
    this.mouseDX = 0
    this.mouseDY = 0
    return { dx, dy }
  }
}
