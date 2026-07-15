import * as THREE from 'three'
import { makePromptSprite } from './promptSprite.js'

const INTERACT_RADIUS = 4.6
const MAX_SPEED = 22
const MAX_REVERSE = 9
const ACCEL = 16
const BRAKE = 26
const FRICTION = 8
const TURN_RATE = 1.5
const HOVER_HEIGHT = 1.1

const STEEL = 0xcfd4da
const STEEL_DARK = 0x9aa0a8
const TRIM = 0x2ee6d6
const GLASS = 0x1a2230

// A low-poly wedge (triangular prism) — CylinderGeometry with 3 radial
// segments is already a prism when top/bottom radii match; rotating it
// reorients the extrusion axis to run along the vehicle's width.
function wedgeGeometry(radius, width) {
  const geo = new THREE.CylinderGeometry(radius, radius, width, 3)
  geo.rotateZ(Math.PI / 2)
  return geo
}

export class Vehicle {
  constructor(x, z) {
    this.x = x
    this.z = z
    this.facing = 0
    this.speed = 0
    this.t = 0
    this.object = new THREE.Group()
    this.object.position.set(x, 0, z)
    this._build()
  }

  _build() {
    const steelMat = new THREE.MeshStandardMaterial({ color: STEEL, flatShading: true, metalness: 0.75, roughness: 0.32 })
    const steelDarkMat = new THREE.MeshStandardMaterial({ color: STEEL_DARK, flatShading: true, metalness: 0.7, roughness: 0.4 })
    const glassMat = new THREE.MeshStandardMaterial({ color: GLASS, flatShading: true, metalness: 0.3, roughness: 0.2 })
    const trimMat = new THREE.MeshStandardMaterial({ color: TRIM, emissive: TRIM, emissiveIntensity: 1, flatShading: true })

    const hull = new THREE.Group()
    hull.position.y = HOVER_HEIGHT
    this.hull = hull
    this.object.add(hull)

    // main low flat body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.62, 3.2), steelMat)
    body.position.y = 0.31
    hull.add(body)

    // cabin box (glass box set into the body, angular)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 1.5), glassMat)
    cabin.position.set(0, 0.86, -0.15)
    hull.add(cabin)

    // sloped hood at the front — triangular prism wedge
    const hood = new THREE.Mesh(wedgeGeometry(0.55, 2.3), steelMat)
    hood.position.set(0, 0.62, 1.75)
    hood.rotation.y = Math.PI
    hull.add(hood)

    // sloped fastback rear
    const rear = new THREE.Mesh(wedgeGeometry(0.55, 2.3), steelDarkMat)
    rear.position.set(0, 0.62, -1.75)
    hull.add(rear)

    // front light bar (signature strip)
    const lightBar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.06), trimMat)
    lightBar.position.set(0, 0.45, 2.2)
    hull.add(lightBar)

    // side trim strakes
    ;[-1, 1].forEach((side) => {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 2.6), trimMat)
      strake.position.set(side * 1.16, 0.3, 0)
      hull.add(strake)
    })

    // anti-grav underside glow + corner thrusters (no wheels — it hovers)
    const glowMat = new THREE.MeshBasicMaterial({
      color: TRIM,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const underGlow = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.12, 8), glowMat)
    underGlow.position.y = -0.05
    hull.add(underGlow)
    this.underGlow = underGlow

    this.thrusters = []
    ;[
      [-0.95, 1.35],
      [0.95, 1.35],
      [-0.95, -1.35],
      [0.95, -1.35],
    ].forEach(([tx, tz]) => {
      const thruster = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.26, 0.12, 8),
        new THREE.MeshStandardMaterial({ color: 0x11151f, flatShading: true })
      )
      thruster.position.set(tx, 0.02, tz)
      hull.add(thruster)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 10), trimMat)
      ring.rotation.x = Math.PI / 2
      ring.position.set(tx, -0.03, tz)
      hull.add(ring)
      this.thrusters.push(ring)
    })

    this.light = new THREE.PointLight(TRIM, 1.2, 6)
    this.light.position.y = -0.3
    hull.add(this.light)

    this.object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    this.prompt = makePromptSprite('enter ✦ E')
    this.prompt.position.set(0, 2.6, 0)
    this.object.add(this.prompt)
  }

  isNear(px, pz) {
    return Math.hypot(px - this.x, pz - this.z) < INTERACT_RADIUS
  }

  // throttle: -1..1 (back/forward), steer: -1..1 (left/right)
  drive(dt, throttle, steer) {
    if (throttle > 0) this.speed += ACCEL * dt
    else if (throttle < 0) this.speed -= BRAKE * dt
    else {
      const decay = FRICTION * dt
      if (this.speed > 0) this.speed = Math.max(0, this.speed - decay)
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + decay)
    }
    this.speed = THREE.MathUtils.clamp(this.speed, -MAX_REVERSE, MAX_SPEED)

    if (Math.abs(this.speed) > 0.4) {
      const dir = this.speed > 0 ? 1 : -1
      this.facing += steer * TURN_RATE * dt * dir
    }

    this.x += Math.sin(this.facing) * this.speed * dt
    this.z += Math.cos(this.facing) * this.speed * dt
  }

  update(dt, groundY, t, playerNear, driving) {
    this.t = t
    if (!driving) {
      // idle friction so a nudged-but-unmanned vehicle settles
      if (this.speed !== 0) this.speed = THREE.MathUtils.lerp(this.speed, 0, Math.min(1, dt * 4))
    }
    this.object.position.set(this.x, groundY, this.z)
    this.object.rotation.y = this.facing

    const bob = Math.sin(t * 1.6) * 0.06
    this.hull.position.y = HOVER_HEIGHT + bob

    const speedFrac = Math.min(1, Math.abs(this.speed) / MAX_SPEED)
    this.thrusters.forEach((ring) => {
      ring.material.emissiveIntensity = 0.6 + speedFrac * 1.2 + Math.sin(t * 10) * 0.15
    })
    this.underGlow.material.opacity = 0.4 + speedFrac * 0.4
    this.light.intensity = 0.9 + speedFrac * 1.4

    this.prompt.visible = !driving && playerNear
    if (this.prompt.visible) this.prompt.position.y = 2.6 + Math.sin(t * 3) * 0.15
  }
}
