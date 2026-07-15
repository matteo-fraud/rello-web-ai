import * as THREE from 'three'

const geo = new THREE.TetrahedronGeometry(0.07, 0)

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene
    this.particles = []
  }

  burst(x, y, z, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2.2
      const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(x, y, z)
      this.scene.add(mesh)
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        vy: 2.5 + Math.random() * 2,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
      })
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life += dt
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh)
        p.mesh.material.dispose()
        this.particles.splice(i, 1)
        continue
      }
      p.vy -= 9 * dt
      p.mesh.position.x += p.vx * dt
      p.mesh.position.y += p.vy * dt
      p.mesh.position.z += p.vz * dt
      p.mesh.rotation.x += dt * 6
      p.mesh.rotation.y += dt * 4
      const t = p.life / p.maxLife
      p.mesh.material.opacity = 1 - t
      p.mesh.material.transparent = true
    }
  }
}
