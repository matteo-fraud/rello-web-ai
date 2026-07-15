import * as THREE from 'three'

const SPEED = 9
const TURN_LERP = 10
const MOVE_BLEND_RATE = 7

const GRAVITY = 9 // low-gravity, floaty jump arc to match the space aesthetic
const JUMP_SPEED = 6.2

const SKIN = 0xc9946a
const SUIT = 0x1c2340
const SUIT_TRIM = 0x2ee6d6
const HELMET = 0x8fd8ff
const GOLD = 0xe8c355
const GEM = 0xff5ad1
const BOOM = 0x2a2f45
const BOOM_LIGHT = 0x2ee6d6

// Hip/shoulder pivot -> upper segment -> knee/elbow joint -> lower segment,
// so limbs can bend instead of swinging as one rigid rod.
function twoSegmentLimb(upperLen, lowerLen, width, color) {
  const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.7 })
  const pivot = new THREE.Group()
  const upperMesh = new THREE.Mesh(new THREE.BoxGeometry(width, upperLen, width), mat)
  upperMesh.position.y = -upperLen / 2
  pivot.add(upperMesh)

  const joint = new THREE.Group()
  joint.position.y = -upperLen
  pivot.add(joint)

  const lowerMesh = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, lowerLen, width * 0.82), mat)
  lowerMesh.position.y = -lowerLen / 2
  joint.add(lowerMesh)

  return { pivot, joint, lowerLen }
}

export class Player {
  constructor() {
    this.facingAngle = 0
    this.moving = false
    this.moveBlend = 0
    this.walkT = 0
    this.velocityY = 0
    this.airY = 0
    this.grounded = true
    this.object = new THREE.Group()
    this._build()
  }

  _build() {
    const hipY = 0.86
    const hips = new THREE.Group()
    hips.position.y = hipY
    this.object.add(hips)
    this.hips = hips

    // torso pivot — everything above the waist leans forward from here when moving
    const torso = new THREE.Group()
    hips.add(torso)
    this.torso = torso

    const torsoMat = new THREE.MeshStandardMaterial({ color: SUIT, flatShading: true, roughness: 0.7 })
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.58, 0.34), torsoMat)
    torsoMesh.position.y = 0.32
    torso.add(torsoMesh)

    const trimMat = new THREE.MeshStandardMaterial({
      color: SUIT_TRIM,
      emissive: SUIT_TRIM,
      emissiveIntensity: 0.7,
      flatShading: true,
    })
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.07, 0.36), trimMat)
    trim.position.y = 0.14
    torso.add(trim)

    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.025, 6, 12),
      new THREE.MeshStandardMaterial({ color: GOLD, flatShading: true, metalness: 0.6, roughness: 0.35 })
    )
    chain.rotation.x = Math.PI / 2
    chain.position.set(0, 0.5, 0.17)
    torso.add(chain)
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06, 0),
      new THREE.MeshStandardMaterial({ color: GEM, emissive: GEM, emissiveIntensity: 0.9, flatShading: true })
    )
    gem.position.set(0, 0.4, 0.19)
    torso.add(gem)

    // head + helmet
    const head = new THREE.Group()
    head.position.y = 0.72
    torso.add(head)
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
    torso.add(jet)
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

    // arms — shoulder -> upper arm -> elbow -> forearm
    const gloveMat = new THREE.MeshStandardMaterial({ color: SUIT_TRIM, flatShading: true, roughness: 0.6 })
    const leftArmRig = twoSegmentLimb(0.19, 0.16, 0.13, SUIT)
    leftArmRig.pivot.position.set(0.33, 0.58, 0)
    torso.add(leftArmRig.pivot)
    const rightArmRig = twoSegmentLimb(0.19, 0.16, 0.13, SUIT)
    rightArmRig.pivot.position.set(-0.33, 0.58, 0)
    torso.add(rightArmRig.pivot)
    ;[leftArmRig, rightArmRig].forEach((rig) => {
      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 6), gloveMat)
      glove.position.y = -rig.lowerLen
      rig.joint.add(glove)
    })
    this.leftArm = leftArmRig.pivot
    this.leftElbow = leftArmRig.joint
    this.rightArm = rightArmRig.pivot
    this.rightElbow = rightArmRig.joint

    // legs — hip -> thigh -> knee -> shin
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x151a2e,
      emissive: SUIT_TRIM,
      emissiveIntensity: 0.4,
      flatShading: true,
    })
    const leftLegRig = twoSegmentLimb(0.24, 0.2, 0.16, SUIT)
    leftLegRig.pivot.position.set(0.15, 0, 0)
    hips.add(leftLegRig.pivot)
    const rightLegRig = twoSegmentLimb(0.24, 0.2, 0.16, SUIT)
    rightLegRig.pivot.position.set(-0.15, 0, 0)
    hips.add(rightLegRig.pivot)
    ;[leftLegRig, rightLegRig].forEach((rig) => {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.28), bootMat)
      boot.position.set(0, -rig.lowerLen + 0.02, 0.04)
      rig.joint.add(boot)
    })
    this.leftLeg = leftLegRig.pivot
    this.leftKnee = leftLegRig.joint
    this.rightLeg = rightLegRig.pivot
    this.rightKnee = rightLegRig.joint

    this.object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = false
      }
    })
  }

  get position() {
    return this.object.position
  }

  jump() {
    if (this.grounded) {
      this.velocityY = JUMP_SPEED
      this.grounded = false
    }
  }

  update(dt, moveVec, groundY) {
    this.moving = moveVec.x !== 0 || moveVec.z !== 0
    this.moveBlend += ((this.moving ? 1 : 0) - this.moveBlend) * Math.min(1, dt * MOVE_BLEND_RATE)

    if (this.moving) {
      this.object.position.x += moveVec.x * SPEED * dt
      this.object.position.z += moveVec.z * SPEED * dt
      const targetAngle = Math.atan2(moveVec.x, moveVec.z)
      let diff = ((targetAngle - this.facingAngle + Math.PI) % (Math.PI * 2)) - Math.PI
      this.facingAngle += diff * Math.min(1, dt * TURN_LERP)
    }
    this.walkT += dt * 9 * this.moveBlend

    // vertical (jump) physics — low gravity, floaty arc
    if (!this.grounded) {
      this.velocityY -= GRAVITY * dt
      this.airY += this.velocityY * dt
      if (this.airY <= 0) {
        this.airY = 0
        this.velocityY = 0
        this.grounded = true
      }
    }

    this.object.rotation.y = this.facingAngle
    this.object.position.y = groundY + this.airY

    const phaseL = this.walkT
    const phaseR = this.walkT + Math.PI
    const swingL = Math.sin(phaseL) * 0.55 * this.moveBlend
    const swingR = Math.sin(phaseR) * 0.55 * this.moveBlend
    this.leftLeg.rotation.x = swingL
    this.rightLeg.rotation.x = swingR
    this.leftKnee.rotation.x = Math.max(0, Math.sin(phaseL)) * 0.95 * this.moveBlend
    this.rightKnee.rotation.x = Math.max(0, Math.sin(phaseR)) * 0.95 * this.moveBlend

    this.leftArm.rotation.x = swingR * 0.7
    this.rightArm.rotation.x = swingL * 0.7
    this.leftElbow.rotation.x = 0.2 + Math.max(0, Math.sin(phaseR)) * 0.3 * this.moveBlend
    this.rightElbow.rotation.x = 0.2 + Math.max(0, Math.sin(phaseL)) * 0.3 * this.moveBlend

    if (!this.grounded) {
      // tuck slightly while airborne
      this.leftKnee.rotation.x = THREE.MathUtils.lerp(this.leftKnee.rotation.x, 0.5, 0.3)
      this.rightKnee.rotation.x = THREE.MathUtils.lerp(this.rightKnee.rotation.x, 0.5, 0.3)
    }

    this.torso.rotation.x = -0.14 * this.moveBlend

    const bob = this.moveBlend > 0.02 ? Math.abs(Math.sin(this.walkT)) * 0.07 * this.moveBlend : Math.sin(performance.now() * 0.0015) * 0.02
    this.hips.position.y = 0.86 + bob

    const pulse = 0.6 + Math.sin(performance.now() * 0.006) * 0.4
    ;[-1, 0, 1].forEach((i) => {
      const bar = this[`jetBar${i}`]
      if (bar) bar.material.emissiveIntensity = 0.5 + pulse * (this.moving ? 1 : 0.4)
    })
  }

  // Returns true on frames where a footstep "lands" (for sfx/dust timing).
  footstepTick() {
    if (!this.moving || !this.grounded) return false
    const phase = this.walkT % (Math.PI * 2)
    if (this._lastPhase === undefined) this._lastPhase = phase
    const crossed = (this._lastPhase < Math.PI && phase >= Math.PI) || (this._lastPhase > phase && phase < 0.2)
    this._lastPhase = phase
    return crossed
  }
}
