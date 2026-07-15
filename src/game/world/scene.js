import * as THREE from 'three'
import { terrainHeight } from './terrain.js'

const SKY_TOP = 0x140a2e
const SKY_HORIZON = 0x4a2f6a
const SAND_COLOR = 0x8a6a4a
const FOG_COLOR = 0x2a1f4a

export function heightAt(x, z) {
  return terrainHeight(x, z)
}

export function buildScene(bounds) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(SKY_TOP)
  scene.fog = new THREE.FogExp2(FOG_COLOR, 0.012)

  const hemi = new THREE.HemisphereLight(0x8fa0ff, 0x3a2a1a, 1.1)
  scene.add(hemi)
  const moonLight = new THREE.DirectionalLight(0xbfd0ff, 1.2)
  moonLight.position.set(-40, 60, -20)
  scene.add(moonLight)
  const fillLight = new THREE.DirectionalLight(0xff9a6a, 0.35)
  fillLight.position.set(30, 20, 40)
  scene.add(fillLight)

  const groundSize = bounds * 2.4
  const segments = 90
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, segments, segments)
  groundGeo.rotateX(-Math.PI / 2)
  const pos = groundGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, terrainHeight(x, z))
  }
  groundGeo.computeVertexNormals()
  const groundMat = new THREE.MeshStandardMaterial({
    color: SAND_COLOR,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.receiveShadow = false
  scene.add(ground)

  scene.add(buildSkyDome())
  scene.add(buildStars())
  scene.add(buildMoon(60, -30, -220, 34, 0xd8dce8))
  scene.add(buildMoon(-160, -10, -260, 20, 0xb9a8c9))
  scene.add(buildRingedPlanet(220, 40, -340, 46))

  return { scene, ground, hemi, moonLight }
}

function buildSkyDome() {
  const geo = new THREE.SphereGeometry(480, 24, 16)
  const top = new THREE.Color(SKY_TOP)
  const horizon = new THREE.Color(0x5a3a6a)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const t = THREE.MathUtils.clamp((y + 120) / 300, 0, 1)
    const c = horizon.clone().lerp(top, t)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })
  const dome = new THREE.Mesh(geo, mat)
  dome.renderOrder = -1
  return dome
}

function buildStars() {
  const count = 1400
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 400 + Math.random() * 250
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 0.85) // keep mostly above horizon
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 10
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })
  const points = new THREE.Points(geo, mat)
  points.matrixAutoUpdate = false
  points.updateMatrix()
  return points
}

function buildMoon(x, y, z, radius, color) {
  const geo = new THREE.IcosahedronGeometry(radius, 1)
  const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, fog: false })
  const moon = new THREE.Mesh(geo, mat)
  moon.position.set(x, y, z)
  return moon
}

function buildRingedPlanet(x, y, z, radius) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 1),
    new THREE.MeshStandardMaterial({ color: 0xc97a5a, flatShading: true, roughness: 0.85, fog: false })
  )
  group.add(body)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.5, radius * 2.2, 48),
    new THREE.MeshBasicMaterial({ color: 0xe8c98a, side: THREE.DoubleSide, transparent: true, opacity: 0.55, fog: false })
  )
  ring.rotation.x = Math.PI / 2.6
  group.add(ring)
  group.position.set(x, y, z)
  return group
}
