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

  const hemi = new THREE.HemisphereLight(0x8fa0ff, 0x3a2a1a, 0.45)
  scene.add(hemi)

  // Low, grazing angle (roughly perpendicular to the dune ridge direction)
  // so windward/leeward faces read with real contrast, like raking desert
  // light — a light straight overhead makes dunes look completely flat.
  const moonLight = new THREE.DirectionalLight(0xcfe0ff, 2.3)
  moonLight.position.set(-52, 22, 145)
  moonLight.castShadow = true
  moonLight.shadow.mapSize.set(2048, 2048)
  const shadowSpan = Math.min(bounds * 1.1, 160)
  moonLight.shadow.camera.left = -shadowSpan
  moonLight.shadow.camera.right = shadowSpan
  moonLight.shadow.camera.top = shadowSpan
  moonLight.shadow.camera.bottom = -shadowSpan
  moonLight.shadow.camera.near = 10
  moonLight.shadow.camera.far = 260
  moonLight.shadow.bias = -0.0015
  scene.add(moonLight)
  scene.add(moonLight.target)

  const fillLight = new THREE.DirectionalLight(0xff9a6a, 0.5)
  fillLight.position.set(30, 20, 40)
  scene.add(fillLight)

  const groundSize = bounds * 2.2
  const segments = 170
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, segments, segments)
  groundGeo.rotateX(-Math.PI / 2)
  const pos = groundGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, terrainHeight(x, z))
  }
  groundGeo.computeVertexNormals()
  const sandTexture = buildSandTexture()
  const tileRepeat = groundSize / 9
  sandTexture.repeat.set(tileRepeat, tileRepeat)
  const groundMat = new THREE.MeshStandardMaterial({
    map: sandTexture,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.receiveShadow = true
  scene.add(ground)

  scene.add(buildSkyDome())
  scene.add(buildStars())
  scene.add(buildMoon(60, -30, -220, 34, 0xd8dce8))
  scene.add(buildMoon(-160, -10, -260, 20, 0xb9a8c9))
  scene.add(buildRingedPlanet(220, 40, -340, 46))

  return { scene, ground, hemi, moonLight }
}

// A tileable grainy sand texture, generated on a canvas — gives the dunes
// visible texture/grain instead of a flat vertex color.
function buildSandTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const base = new THREE.Color(SAND_COLOR)
  ctx.fillStyle = `rgb(${base.r * 255}, ${base.g * 255}, ${base.b * 255})`
  ctx.fillRect(0, 0, size, size)

  const image = ctx.getImageData(0, 0, size, size)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 34
    data[i] = THREE.MathUtils.clamp(data[i] + grain, 0, 255)
    data[i + 1] = THREE.MathUtils.clamp(data[i + 1] + grain * 0.9, 0, 255)
    data[i + 2] = THREE.MathUtils.clamp(data[i + 2] + grain * 0.7, 0, 255)
  }
  ctx.putImageData(image, 0, 0)

  // scattered darker pebbles/speckles for a bit more variation at a glance
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 0.5 + Math.random() * 1.6
    ctx.fillStyle = `rgba(60, 40, 20, ${0.15 + Math.random() * 0.2})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
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
