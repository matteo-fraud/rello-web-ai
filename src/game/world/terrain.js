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

// Sweeping, wind-aligned dune ridges (like a real dune field): a dominant
// ridge direction with an asymmetric profile (long gentle windward slope,
// short steep leeward slip-face) instead of a plain symmetric sine, warped
// so the ridges meander instead of running in perfectly straight lines.
const DUNE_DIR = 0.35
const DUNE_COS = Math.cos(DUNE_DIR)
const DUNE_SIN = Math.sin(DUNE_DIR)

// t in [0,1) -> asymmetric ridge profile in [0,1]: slow rise, fast fall.
function duneProfile(t) {
  return t < 0.72 ? Math.pow(t / 0.72, 1.6) : 1 - Math.pow((t - 0.72) / 0.28, 0.7)
}

function ridgeLayer(dc, warp, freq, amplitude, phaseOffset) {
  const phase = (dc + warp) * freq + phaseOffset
  const t = phase / (Math.PI * 2) - Math.floor(phase / (Math.PI * 2))
  return (duneProfile(t) - 0.42) * amplitude
}

export function terrainHeight(x, z) {
  const dc = x * DUNE_COS + z * DUNE_SIN // across the ridges
  const cc = -x * DUNE_SIN + z * DUNE_COS // along the ridges
  const warp = valueNoise(cc * 0.015, dc * 0.015) * 14
  const bigDunes = ridgeLayer(dc, warp, 0.085, 4.4, 0)
  const smallDunes = ridgeLayer(dc, warp * 1.4, 0.22, 1.5, 2.1)
  const rolling = valueNoise(x * 0.01, z * 0.01) * 1.6
  const ripple = valueNoise(x * 0.2 + 100, z * 0.2 + 100) * 0.12
  return bigDunes + smallDunes + rolling + ripple
}

const CAMPFIRE_POS = { x: 0, z: 0 }
const RECORD_SPACING_MIN = 16
const RECORD_SPACING_MAX = 24
const FIRST_RECORD_DIST = 20

// Scatters records outward from the campfire along a gentle winding path so
// the player naturally discovers them while exploring, rather than in a
// straight line.
export function buildLayout(trackCount) {
  const positions = []
  let angle = 0.6
  let dist = FIRST_RECORD_DIST
  for (let i = 0; i < trackCount; i++) {
    positions.push({
      x: CAMPFIRE_POS.x + Math.cos(angle) * dist,
      z: CAMPFIRE_POS.z + Math.sin(angle) * dist,
    })
    angle += 0.75 + hash(i * 3.1) * 0.5
    dist += RECORD_SPACING_MIN + hash(i * 7.31 + 2) * (RECORD_SPACING_MAX - RECORD_SPACING_MIN)
  }
  const bounds = dist + 20
  return { campfire: CAMPFIRE_POS, recordPositions: positions, bounds }
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
