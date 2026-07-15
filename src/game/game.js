import * as THREE from 'three'
import { tracks } from '../data/tracks.js'
import { artist } from '../data/artist.js'
import { buildLayout, buildDecor } from './world/terrain.js'
import { buildScene, heightAt } from './world/scene.js'
import { createDecorMesh } from './world/decor.js'
import { Player } from './entities/player.js'
import { Record } from './entities/record.js'
import { Campfire } from './entities/campfire.js'
import { ParticleSystem } from './entities/particles.js'
import { Input } from './input.js'
import { Sfx } from './sfx.js'
import { Hud } from './ui/hud.js'
import { TrackPanel } from './ui/trackPanel.js'
import { TracklistPanel } from './ui/tracklistPanel.js'
import { AboutPanel } from './ui/aboutPanel.js'

const RENDER_SCALE = 0.62 // internal resolution divider — chunky, PS2-ish upscale
const CAM_DISTANCE = 6.4
const CAM_TARGET_HEIGHT = 1.3
const TOUCH_TURN_SPEED = 2.0
const MOUSE_SENSITIVITY = 0.0026
const CAM_LERP = 8
const PITCH_MIN = -0.15
const PITCH_MAX = 1.05

export class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.time = 0
    this.lastTime = 0
    this.cameraPitch = 0.32

    this.layout = buildLayout(tracks.length)
    const { scene } = buildScene(this.layout.bounds)
    this.scene = scene

    this.decor = buildDecor(this.layout.bounds, [this.layout.campfire, ...this.layout.recordPositions])
    this.decor.forEach((item) => this.scene.add(createDecorMesh(item)))

    const startPos = { x: this.layout.campfire.x + 4, z: this.layout.campfire.z - 6 }
    const firstRecord = this.layout.recordPositions[0]
    this.cameraYaw = Math.atan2(firstRecord.x - startPos.x, firstRecord.z - startPos.z)

    this.player = new Player()
    this.player.facingAngle = this.cameraYaw
    this.scene.add(this.player.object)
    this.player.object.position.set(startPos.x, 0, startPos.z)

    this.records = this.layout.recordPositions.map((p, i) => new Record(p.x, p.z, tracks[i], i))
    this.records.forEach((r) => this.scene.add(r.object))

    this.campfire = new Campfire(this.layout.campfire.x, this.layout.campfire.z)
    this.scene.add(this.campfire.object)

    this.particles = new ParticleSystem(this.scene)

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(1)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.input = new Input(canvas)
    this.sfx = new Sfx()

    this.trackPanel = new TrackPanel({ tracks })
    this.tracklistPanel = new TracklistPanel({
      tracks,
      isUnearthed: (i) => this.records[i].state === 'unearthed',
      onSelect: (i) => this.trackPanel.open(i),
    })
    this.aboutPanel = new AboutPanel({ artist })
    this.hud = new Hud({
      totalTracks: tracks.length,
      sfx: this.sfx,
      onAbout: () => this.aboutPanel.open(),
      onTracklist: () => this.tracklistPanel.open(),
    })

    this._resize = this._resize.bind(this)
    this._loop = this._loop.bind(this)
    window.addEventListener('resize', this._resize)
    this._resize()
  }

  start() {
    this.sfx.unlock()
    this.hud.show()
    this.hud.setUnearthedCount(this._unearthedCount())
    this.lastTime = performance.now()
    requestAnimationFrame(this._loop)
  }

  _unearthedCount() {
    return this.records.filter((r) => r.state === 'unearthed').length
  }

  _resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(Math.round(this.width * RENDER_SCALE), Math.round(this.height * RENDER_SCALE), false)
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000)
    this.lastTime = now
    this.time += dt
    this._update(dt)
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this._loop)
  }

  _update(dt) {
    const px = this.player.object.position.x
    const pz = this.player.object.position.z
    const campfireNear = this.campfire.isNear(px, pz)

    this.campfire.update(dt, heightAt(this.campfire.x, this.campfire.z), this.time, campfireNear)
    this.particles.update(dt)

    const interactPressed = this.input.consumeInteract()
    const modalOpen = this.trackPanel.isOpen || this.aboutPanel.isOpen || this.tracklistPanel.isOpen

    this.records.forEach((r) => {
      const wasDigging = r.state === 'digging'
      const near = r.isNear(px, pz)
      r.update(dt, heightAt(r.x, r.z), this.time, this.particles, near)
      if (wasDigging && r.state === 'unearthed') this._onRecordUnearthed(r)
    })

    const { dx, dy } = this.input.consumeMouseDelta()

    if (!modalOpen) {
      this.cameraYaw -= dx * MOUSE_SENSITIVITY
      if (this.input.turnLeft) this.cameraYaw += TOUCH_TURN_SPEED * dt
      if (this.input.turnRight) this.cameraYaw -= TOUCH_TURN_SPEED * dt
      this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + dy * MOUSE_SENSITIVITY, PITCH_MIN, PITCH_MAX)

      const fwd = { x: Math.sin(this.cameraYaw), z: Math.cos(this.cameraYaw) }
      const right = { x: Math.cos(this.cameraYaw), z: -Math.sin(this.cameraYaw) }
      let mx = 0
      let mz = 0
      if (this.input.forward) {
        mx += fwd.x
        mz += fwd.z
      }
      if (this.input.back) {
        mx -= fwd.x
        mz -= fwd.z
      }
      if (this.input.strafeRight) {
        mx += right.x
        mz += right.z
      }
      if (this.input.strafeLeft) {
        mx -= right.x
        mz -= right.z
      }
      const moveLen = Math.hypot(mx, mz)
      if (moveLen > 0) {
        mx /= moveLen
        mz /= moveLen
        this.hud.fadeHint()
      }

      const groundY = heightAt(this.player.object.position.x, this.player.object.position.z)
      this.player.update(dt, { x: mx, z: mz }, groundY)
      if (this.player.footstepTick()) this.sfx.footstep()

      if (interactPressed) {
        if (campfireNear) {
          this.sfx.uiBlip()
          this.aboutPanel.open()
        } else {
          const nearRecord = this.records.find((r) => r.isNearInteractable && r.isNear(this.player.object.position.x, this.player.object.position.z))
          if (nearRecord) {
            nearRecord.startDig()
            this.sfx.dig()
          }
        }
      }
    }

    this._updateCamera(dt)
  }

  _updateCamera(dt) {
    const p = this.player.object.position
    const horiz = Math.cos(this.cameraPitch)
    const offset = new THREE.Vector3(
      -Math.sin(this.cameraYaw) * horiz * CAM_DISTANCE,
      Math.sin(this.cameraPitch) * CAM_DISTANCE + CAM_TARGET_HEIGHT,
      -Math.cos(this.cameraYaw) * horiz * CAM_DISTANCE
    )
    const desired = new THREE.Vector3(p.x, p.y, p.z).add(offset)
    if (!this._camPos) {
      this._camPos = desired.clone()
    } else {
      this._camPos.lerp(desired, Math.min(1, CAM_LERP * dt))
    }
    this.camera.position.copy(this._camPos)
    const lookTarget = new THREE.Vector3(p.x, p.y + CAM_TARGET_HEIGHT, p.z)
    if (!this._lookTarget) this._lookTarget = lookTarget.clone()
    this._lookTarget.lerp(lookTarget, Math.min(1, CAM_LERP * dt))
    this.camera.lookAt(this._lookTarget)
  }

  _onRecordUnearthed(record) {
    this.hud.setUnearthedCount(this._unearthedCount())
    this.trackPanel.open(record.index)
  }
}
