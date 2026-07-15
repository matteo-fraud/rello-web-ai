import * as THREE from 'three'

// A small canvas-rendered "dig ✦ E" style label that always faces the
// camera (a Three.js Sprite), used for interaction prompts in world space.
export function makePromptSprite(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(15, 12, 25, 0.8)'
  roundRect(ctx, 8, 20, 240, 56, 26)
  ctx.fill()
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)'
  ctx.lineWidth = 3
  roundRect(ctx, 8, 20, 240, 56, 26)
  ctx.stroke()
  ctx.fillStyle = '#eaf6ff'
  ctx.font = 'bold 34px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, 48)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(2.4, 0.9, 1)
  sprite.renderOrder = 10
  return sprite
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
