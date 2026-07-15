import * as THREE from 'three'
import { makePromptSprite } from './promptSprite.js'

const INTERACT_RADIUS = 3.8

export class Beacon {
  constructor(x, z) {
    this.x = x
    this.z = z
    this.t = 0
    this.object = new THREE.Group()
    this.object.position.set(x, 0, z)
    this._build()
  }

  _build() {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a3448, flatShading: true, roughness: 0.8 })
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.35, 8), baseMat)
    base.position.y = 0.17
    this.object.add(base)

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x2ee6d6,
      emissive: 0x2ee6d6,
      emissiveIntensity: 0.8,
      flatShading: true,
    })
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 6, 12), ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.36
    this.object.add(ring)

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x8fe8ff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 2.6, 8, 1, true), beamMat)
    beam.position.y = 1.6
    this.object.add(beam)
    this.beam = beam

    this.light = new THREE.PointLight(0x6fe0ff, 2.2, 10)
    this.light.position.y = 1.4
    this.object.add(this.light)

    this.orbs = []
    for (let i = 0; i < 3; i++) {
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.09, 0),
        new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 1, flatShading: true })
      )
      this.object.add(orb)
      this.orbs.push({ mesh: orb, phase: (i / 3) * Math.PI * 2 })
    }

    this.prompt = makePromptSprite('about ✦ E')
    this.prompt.position.set(0, 3.0, 0)
    this.object.add(this.prompt)
  }

  isNear(px, pz) {
    return Math.hypot(px - this.x, pz - this.z) < INTERACT_RADIUS
  }

  update(dt, groundY, t, playerNear) {
    this.t = t
    this.object.position.y = groundY
    const flicker = 1.8 + Math.sin(t * 9) * 0.3 + Math.sin(t * 21) * 0.15
    this.light.intensity = flicker
    this.beam.material.opacity = 0.35 + Math.sin(t * 6) * 0.1
    this.beam.scale.y = 1 + Math.sin(t * 4) * 0.04

    this.orbs.forEach(({ mesh, phase }) => {
      const a = t * 1.4 + phase
      mesh.position.set(Math.cos(a) * 1.1, 1.2 + Math.sin(t * 2 + phase) * 0.3, Math.sin(a) * 1.1)
    })

    this.prompt.visible = playerNear
    if (playerNear) this.prompt.position.y = 3.0 + Math.sin(t * 3) * 0.15
  }
}
