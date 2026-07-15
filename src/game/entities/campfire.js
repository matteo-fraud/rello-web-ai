import * as THREE from 'three'
import { makePromptSprite } from './promptSprite.js'

const INTERACT_RADIUS = 3.8

const logMat = new THREE.MeshStandardMaterial({ color: 0x4a3018, flatShading: true, roughness: 0.9 })
const logCharredMat = new THREE.MeshStandardMaterial({ color: 0x1c140c, flatShading: true, roughness: 0.95 })
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a564e, flatShading: true, roughness: 0.95 })

export class Campfire {
  constructor(x, z) {
    this.x = x
    this.z = z
    this.t = 0
    this.object = new THREE.Group()
    this.object.position.set(x, 0, z)
    this._build()
  }

  _build() {
    // ash bed
    const bed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.85, 0.08, 10),
      new THREE.MeshStandardMaterial({ color: 0x2a2420, flatShading: true, roughness: 1 })
    )
    bed.position.y = 0.04
    bed.receiveShadow = true
    this.object.add(bed)

    // stone ring
    const stoneCount = 8
    for (let i = 0; i < stoneCount; i++) {
      const a = (i / stoneCount) * Math.PI * 2
      const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + (i % 3) * 0.03, 0), stoneMat)
      stone.position.set(Math.cos(a) * 0.85, 0.12, Math.sin(a) * 0.85)
      stone.rotation.set(a, a * 0.6, 0)
      stone.castShadow = true
      stone.receiveShadow = true
      this.object.add(stone)
    }

    // crossed logs, teepee-style
    const logGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.5, 6)
    const logAngles = [0, 1.1, 2.3, 3.4, 4.6]
    logAngles.forEach((a, i) => {
      const log = new THREE.Mesh(logGeo, i % 2 === 0 ? logMat : logCharredMat)
      log.position.set(Math.cos(a) * 0.12, 0.42, Math.sin(a) * 0.12)
      log.rotation.z = Math.PI / 2.5
      log.rotation.y = a
      log.castShadow = true
      this.object.add(log)
    })

    // flame — layered translucent cones, additive glow
    this.flameGroup = new THREE.Group()
    this.flameGroup.position.y = 0.5
    this.object.add(this.flameGroup)

    const outerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.9, 7),
      new THREE.MeshBasicMaterial({
        color: 0xff7a2e,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    outerFlame.position.y = 0.42
    this.flameGroup.add(outerFlame)
    this.outerFlame = outerFlame

    const innerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.17, 0.55, 7),
      new THREE.MeshBasicMaterial({
        color: 0xffe066,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    innerFlame.position.y = 0.3
    this.flameGroup.add(innerFlame)
    this.innerFlame = innerFlame

    this.light = new THREE.PointLight(0xff9a4a, 2.4, 9, 2)
    this.light.position.y = 0.7
    this.light.castShadow = true
    this.light.shadow.mapSize.set(512, 512)
    this.object.add(this.light)

    // rising embers
    this.embers = []
    for (let i = 0; i < 8; i++) {
      const ember = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.03, 0),
        new THREE.MeshStandardMaterial({ color: 0xffaa55, emissive: 0xff8833, emissiveIntensity: 1.4, flatShading: true })
      )
      this.object.add(ember)
      this.embers.push({ mesh: ember, seed: Math.random() * 10, speed: 0.5 + Math.random() * 0.5 })
    }

    this.prompt = makePromptSprite('about ✦ E')
    this.prompt.position.set(0, 2.6, 0)
    this.object.add(this.prompt)
  }

  isNear(px, pz) {
    return Math.hypot(px - this.x, pz - this.z) < INTERACT_RADIUS
  }

  update(dt, groundY, t, playerNear) {
    this.t = t
    this.object.position.y = groundY

    const flicker = 2.2 + Math.sin(t * 11) * 0.35 + Math.sin(t * 23 + 1) * 0.2 + Math.sin(t * 5) * 0.15
    this.light.intensity = Math.max(0.6, flicker)

    const wobble = Math.sin(t * 13) * 0.08 + Math.sin(t * 27 + 2) * 0.05
    this.outerFlame.scale.set(1 + wobble * 0.5, 1 + Math.sin(t * 9) * 0.12, 1 + wobble * 0.5)
    this.innerFlame.scale.set(1 - wobble * 0.3, 1 + Math.sin(t * 15 + 1) * 0.15, 1 - wobble * 0.3)
    this.flameGroup.rotation.y = t * 0.6

    this.embers.forEach((e) => {
      const cycle = ((t * e.speed + e.seed) % 2) / 2
      e.mesh.position.set(Math.sin(e.seed * 3 + t * 0.7) * 0.25 * (1 + cycle), 0.5 + cycle * 1.8, Math.cos(e.seed * 2 + t * 0.7) * 0.25 * (1 + cycle))
      e.mesh.material.opacity = 1 - cycle
      e.mesh.material.transparent = true
    })

    this.prompt.visible = playerNear
    if (playerNear) this.prompt.position.y = 2.6 + Math.sin(t * 3) * 0.15
  }
}
