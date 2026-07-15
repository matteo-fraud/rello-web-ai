// Shared ground-height math + world layout for the 3D cosmic desert.
// Both the terrain mesh and the entities (player, records, beacon) need to
// agree on "how tall are the dunes at world (x,z)".

export function hash(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

function hash2(x, z) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453
  return s - Math.floor(s)
}

// Cheap value-noise (bilinear-interpolated lattice) — good enough for
// faceted low-poly dunes, no need for real Perlin/Simplex here.
function valueNoise(x, z) {
  const xi = Math.floor(x)
  const zi = Math.floor(z)
  const xf = x - xi
  const zf = z - zi
  const a = hash2(xi, zi)
  const b = hash2(xi + 1, zi)
  const c = hash2(xi, zi + 1)
  const d = hash2(xi + 1, zi + 1)
  const u = xf * xf * (3 - 2 * xf)
  const v = zf * zf * (3 - 2 * zf)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

export function terrainHeight(x, z) {
  const large = valueNoise(x * 0.012, z * 0.012) * 2.8
  const mid = valueNoise(x * 0.04 + 50, z * 0.04 + 50) * 0.9
  const small = valueNoise(x * 0.15 + 100, z * 0.15 + 100) * 0.22
  return large + mid + small
}

const BEACON_POS = { x: 0, z: 0 }
const RECORD_SPACING_MIN = 16
const RECORD_SPACING_MAX = 24
const FIRST_RECORD_DIST = 20

// Scatters records outward from the beacon along a gentle winding path so
// the player naturally discovers them while exploring, rather than in a
// straight line.
export function buildLayout(trackCount) {
  const positions = []
  let angle = 0.6
  let dist = FIRST_RECORD_DIST
  for (let i = 0; i < trackCount; i++) {
    positions.push({
      x: BEACON_POS.x + Math.cos(angle) * dist,
      z: BEACON_POS.z + Math.sin(angle) * dist,
    })
    angle += 0.75 + hash(i * 3.1) * 0.5
    dist += RECORD_SPACING_MIN + hash(i * 7.31 + 2) * (RECORD_SPACING_MAX - RECORD_SPACING_MIN)
  }
  const bounds = dist + 20
  return { beacon: BEACON_POS, recordPositions: positions, bounds }
}

export function buildDecor(bounds, avoidPoints, seedOffset = 0) {
  const decor = []
  const count = 90
  for (let i = 0; i < count; i++) {
    const r1 = hash(i * 3.7 + seedOffset)
    const r2 = hash(i * 9.13 + seedOffset + 1)
    const dist = 8 + r1 * bounds
    const ang = r2 * Math.PI * 2
    const x = Math.cos(ang) * dist
    const z = Math.sin(ang) * dist
    const tooClose = avoidPoints.some((p) => Math.hypot(p.x - x, p.z - z) < 6)
    if (tooClose) continue
    const typeRoll = hash(i * 5.9 + seedOffset + 2)
    const type = typeRoll < 0.4 ? 'crystal' : typeRoll < 0.75 ? 'rock' : 'debris'
    decor.push({
      x,
      z,
      type,
      scale: 0.7 + hash(i * 1.3 + seedOffset) * 0.9,
      rotation: hash(i * 2.9 + seedOffset) * Math.PI * 2,
    })
  }
  return decor
}
