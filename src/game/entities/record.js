import * as THREE from 'three'
import { hash } from '../world/terrain.js'
import { makePromptSprite } from './promptSprite.js'

const R = 0.55
const THICKNESS = 0.09
const INTERACT_RADIUS = 3.4
const DIG_DURATION = 0.65

function easeOutBack(t) {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const discGeo = new THREE.CylinderGeometry(R, R, THICKNESS, 14)
const rimMat = new THREE.MeshStandardMaterial({ color: 0x0c0a0a, flatShading: true, roughness: 0.5 })
const labelGeo = new THREE.CylinderGeometry(R * 0.36, R * 0.36, THICKNESS + 0.01, 14)

export class Record {
  constructor(x, z, track, index) {
    this.x = x
    this.z = z
    this.track = track
    this.index = index
    this.state = 'buried'
    this.buriedT = 0.85
    this.digAnimT = 0
    this.tiltZ = (hash(index * 3.7 + 1) - 0.5) * 0.5
    this.idlePhase = hash(index * 5.1) * Math.PI * 2

    this.object = new THREE.Group()
    this.object.position.set(x, 0, z)

    const disc = new THREE.Mesh(discGeo, rimMat)
    disc.rotation.x = Math.PI / 2
    disc.castShadow = true
    disc.receiveShadow = true
    this.object.add(disc)
    this.discMesh = disc

    const labelMat = new THREE.MeshStandardMaterial({
      color: track.color,
      emissive: track.color,
      emissiveIntensity: 0.25,
      flatShading: true,
      roughness: 0.4,
    })
    const label = new THREE.Mesh(labelGeo, labelMat)
    label.rotation.x = Math.PI / 2
    this.object.add(label)

    this.glowLight = new THREE.PointLight(track.color, 0, 4)
    this.glowLight.position.set(0, 0, 0)
    this.object.add(this.glowLight)

    this.digPrompt = makePromptSprite('dig ✦ E')
    this.digPrompt.position.set(0, R + 1.1, 0)
    this.object.add(this.digPrompt)
    this.digPrompt.visible = false

    this.replayPrompt = makePromptSprite('replay ✦ E')
    this.replayPrompt.position.set(0, R + 1.1, 0)
    this.object.add(this.replayPrompt)
    this.replayPrompt.visible = false
  }

  get isNearInteractable() {
    return this.state === 'buried'
  }

  get canInteract() {
    return this.state !== 'digging'
  }

  distanceTo(px, pz) {
    return Math.hypot(px - this.x, pz - this.z)
  }

  isNear(px, pz) {
    return this.distanceTo(px, pz) < INTERACT_RADIUS
  }

  startDig() {
    if (this.state !== 'buried') return false
    this.state = 'digging'
    this.digAnimT = 0
    return true
  }

  update(dt, groundY, t, particles, playerNear) {
    if (this.state === 'digging') {
      this.digAnimT += dt
      const dt01 = Math.min(1, this.digAnimT / DIG_DURATION)
      const eased = easeOutBack(dt01)
      this.buriedT = 0.85 + (0 - 0.85) * eased
      if (this.digAnimT < DIG_DURATION * 0.6 && Math.random() < 0.7 && particles) {
        particles.burst(
          this.x + (Math.random() - 0.5) * 0.6,
          groundY + 0.1,
          this.z + (Math.random() - 0.5) * 0.6,
          1,
          0xc99a5a
        )
      }
      if (dt01 >= 1) {
        this.state = 'unearthed'
        this.buriedT = 0
      }
    }

    const centerY = groundY + R * (1 - 1.6 * this.buriedT)
    this.object.position.y = centerY
    this.object.rotation.z = this.tiltZ

    if (this.state === 'unearthed') {
      this.object.rotation.y = t * 0.4 + this.idlePhase
      this.glowLight.intensity = 0.6 + Math.sin(t * 2 + this.idlePhase) * 0.3
    } else {
      this.object.rotation.y = this.idlePhase
      this.glowLight.intensity = 0
    }

    const bobY = R + 1.1 + Math.sin(t * 3) * 0.15
    this.digPrompt.visible = this.state === 'buried' && playerNear
    this.replayPrompt.visible = this.state === 'unearthed' && playerNear
    if (this.digPrompt.visible) this.digPrompt.position.y = bobY
    if (this.replayPrompt.visible) this.replayPrompt.position.y = bobY
  }
}
