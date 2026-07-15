import * as THREE from 'three'

const SPEED = 9
const TURN_LERP = 10

const SKIN = 0xc9946a
const SUIT = 0x1c2340
const SUIT_TRIM = 0x2ee6d6
const HELMET = 0x8fd8ff
const GOLD = 0xe8c355
const GEM = 0xff5ad1
const BOOM = 0x2a2f45
const BOOM_LIGHT = 0x2ee6d6

function limb(length, width, color) {
  const pivot = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.7 })
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, length, width), mat)
  mesh.position.y = -length / 2
  pivot.add(mesh)
  return pivot
}

export class Player {
  constructor() {
    this.facingAngle = 0
    this.moving = false
    this.walkT = 0
    this._footPhase = 0
    this.object = new THREE.Group()
    this._build()
  }

  _build() {
    const hipY = 0.86
    const hips = new THREE.Group()
    hips.position.y = hipY
    this.object.add(hips)
    this.hips = hips

    // torso — puffy space jacket
    const torsoMat = new THREE.MeshStandardMaterial({ color: SUIT, flatShading: true, roughness: 0.7 })
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.58, 0.34), torsoMat)
    torso.position.y = 0.32
    hips.add(torso)

    // trim stripe
    const trimMat = new THREE.MeshStandardMaterial({
      color: SUIT_TRIM,
      emissive: SUIT_TRIM,
      emissiveIntensity: 0.7,
      flatShading: true,
    })
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.07, 0.36), trimMat)
    trim.position.y = 0.14
    hips.add(trim)

    // gold chain + gem
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.025, 6, 12),
      new THREE.MeshStandardMaterial({ color: GOLD, flatShading: true, metalness: 0.6, roughness: 0.35 })
    )
    chain.rotation.x = Math.PI / 2
    chain.position.set(0, 0.5, 0.17)
    hips.add(chain)
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06, 0),
      new THREE.MeshStandardMaterial({ color: GEM, emissive: GEM, emissiveIntensity: 0.9, flatShading: true })
    )
    gem.position.set(0, 0.4, 0.19)
    hips.add(gem)

    // head + helmet
    const head = new THREE.Group()
    head.position.y = 0.72
    hips.add(head)
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.26, 0.26),
      new THREE.MeshStandardMaterial({ color: SKIN, flatShading: true, roughness: 0.8 })
    )
    head.add(face)
    const helmet = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.21, 1),
      new THREE.MeshStandardMaterial({
        color: HELMET,
        flatShading: true,
        transparent: true,
        opacity: 0.32,
        roughness: 0.15,
        metalness: 0.1,
      })
    )
    helmet.position.z = 0.02
    head.add(helmet)
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.06, 0.24),
      new THREE.MeshStandardMaterial({ color: SUIT_TRIM, emissive: SUIT_TRIM, emissiveIntensity: 1, flatShading: true })
    )
    visor.position.set(0, 0.02, 0.1)
    head.add(visor)

    // boombox-jetpack on the back
    const jet = new THREE.Group()
    jet.position.set(0, 0.36, -0.24)
    hips.add(jet)
    const jetBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.42, 0.18),
      new THREE.MeshStandardMaterial({ color: BOOM, flatShading: true, roughness: 0.6 })
    )
    jet.add(jetBody)
    for (let i = -1; i <= 1; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.14 + Math.abs(i) * 0.06, 0.03),
        new THREE.MeshStandardMaterial({ color: BOOM_LIGHT, emissive: BOOM_LIGHT, emissiveIntensity: 1, flatShading: true })
      )
      bar.position.set(i * 0.1, -0.05, 0.1)
      jet.add(bar)
      this[`jetBar${i}`] = bar
    }
    const thruster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x11151f, flatShading: true })
    )
    thruster.position.set(0, -0.26, 0)
    jet.add(thruster)
    this.jetGroup = jet

    // arms
    this.leftArm = limb(0.34, 0.13, SUIT)
    this.leftArm.position.set(0.33, 0.58, 0)
    hips.add(this.leftArm)
    this.rightArm = limb(0.34, 0.13, SUIT)
    this.rightArm.position.set(-0.33, 0.58, 0)
    hips.add(this.rightArm)

    const gloveMat = new THREE.MeshStandardMaterial({ color: SUIT_TRIM, flatShading: true, roughness: 0.6 })
    ;[this.leftArm, this.rightArm].forEach((arm) => {
      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), gloveMat)
      glove.position.y = -0.34
      arm.children[0].add(glove)
    })

    // legs
    this.leftLeg = limb(0.44, 0.16, SUIT)
    this.leftLeg.position.set(0.15, 0, 0)
    hips.add(this.leftLeg)
    this.rightLeg = limb(0.44, 0.16, SUIT)
    this.rightLeg.position.set(-0.15, 0, 0)
    hips.add(this.rightLeg)

    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x151a2e,
      emissive: SUIT_TRIM,
      emissiveIntensity: 0.4,
      flatShading: true,
    })
    ;[this.leftLeg, this.rightLeg].forEach((leg) => {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.28), bootMat)
      boot.position.set(0, -0.4, 0.04)
      leg.children[0].add(boot)
    })

    this.object.castShadow = false
  }

  get position() {
    return this.object.position
  }

  update(dt, moveVec, groundY) {
    this.moving = moveVec.x !== 0 || moveVec.z !== 0

    if (this.moving) {
      this.object.position.x += moveVec.x * SPEED * dt
      this.object.position.z += moveVec.z * SPEED * dt
      const targetAngle = Math.atan2(moveVec.x, moveVec.z)
      let diff = ((targetAngle - this.facingAngle + Math.PI) % (Math.PI * 2)) - Math.PI
      this.facingAngle += diff * Math.min(1, dt * TURN_LERP)
      this.walkT += dt * 9
    }

    this.object.rotation.y = this.facingAngle
    this.object.position.y = groundY

    const swing = this.moving ? Math.sin(this.walkT) * 0.55 : 0
    const swingOpp = this.moving ? Math.sin(this.walkT + Math.PI) * 0.55 : 0
    this.leftLeg.rotation.x = swing
    this.rightLeg.rotation.x = swingOpp
    this.leftArm.rotation.x = swingOpp * 0.7
    this.rightArm.rotation.x = swing * 0.7

    const bob = this.moving ? Math.abs(Math.sin(this.walkT)) * 0.07 : Math.sin(performance.now() * 0.0015) * 0.02
    this.hips.position.y = 0.86 + bob

    const pulse = 0.6 + Math.sin(performance.now() * 0.006) * 0.4
    ;[-1, 0, 1].forEach((i) => {
      const bar = this[`jetBar${i}`]
      if (bar) bar.material.emissiveIntensity = 0.5 + pulse * (this.moving ? 1 : 0.4)
    })
  }

  // Returns true on frames where a footstep "lands" (for sfx/dust timing).
  footstepTick() {
    if (!this.moving) return false
    const phase = this.walkT % (Math.PI * 2)
    if (this._lastPhase === undefined) this._lastPhase = phase
    const crossed = (this._lastPhase < Math.PI && phase >= Math.PI) || (this._lastPhase > phase && phase < 0.2)
    this._lastPhase = phase
    return crossed
  }
}
