import * as THREE from 'three'

const crystalGeo = new THREE.ConeGeometry(0.6, 2.4, 5, 1)
const rockGeo = new THREE.IcosahedronGeometry(1, 0)
const debrisGeo = new THREE.BoxGeometry(2.2, 0.12, 1.1)
const debrisFrameGeo = new THREE.BoxGeometry(2.3, 0.08, 0.16)

const crystalMat = new THREE.MeshStandardMaterial({
  color: 0x6a5ad6,
  emissive: 0x3a2a8a,
  emissiveIntensity: 0.6,
  flatShading: true,
  roughness: 0.35,
  transparent: true,
  opacity: 0.85,
})
const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b5d55, flatShading: true, roughness: 1 })
const debrisMat = new THREE.MeshStandardMaterial({ color: 0x394456, flatShading: true, roughness: 0.6, metalness: 0.3 })
const debrisFrameMat = new THREE.MeshStandardMaterial({ color: 0xd8dce8, flatShading: true, roughness: 0.4, metalness: 0.5 })

export function createDecorMesh(item) {
  let group
  if (item.type === 'crystal') {
    const mesh = new THREE.Mesh(crystalGeo, crystalMat)
    mesh.position.y = 1.1
    group = new THREE.Group()
    group.add(mesh)
    if (item.scale > 1.1) {
      const small = new THREE.Mesh(crystalGeo, crystalMat)
      small.scale.setScalar(0.5)
      small.position.set(0.5, 0.55, 0.2)
      small.rotation.z = 0.3
      group.add(small)
    }
  } else if (item.type === 'rock') {
    const mesh = new THREE.Mesh(rockGeo, rockMat)
    mesh.scale.set(1, 0.7, 0.85)
    mesh.position.y = 0.55
    mesh.rotation.set(item.rotation * 0.7, item.rotation, item.rotation * 0.3)
    group = new THREE.Group()
    group.add(mesh)
  } else {
    group = new THREE.Group()
    const panel = new THREE.Mesh(debrisGeo, debrisMat)
    const frame = new THREE.Mesh(debrisFrameGeo, debrisFrameMat)
    frame.position.y = 0.05
    group.add(panel)
    group.add(frame)
    group.rotation.z = 0.35
    group.position.y = 0.3
  }
  group.position.x = item.x
  group.position.z = item.z
  group.rotation.y = item.rotation
  group.scale.multiplyScalar(item.scale)
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  return group
}
