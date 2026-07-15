// Edit this file with your real tracklist. Each track becomes one vinyl
// record buried in the cosmic desert, scattered along the path outward
// from the beacon.
//
//   title       - track name shown on the record label + panel
//   duration    - display string, e.g. "3:24" (purely cosmetic, not read from the file)
//   src         - path to the audio file, served from /public, e.g. '/audio/01-mirage.mp3'
//   color       - accent color for the record label + glow (any CSS color)
//   description - a line or two of liner notes shown in the track panel
//
// The demo ships with short generated placeholder tones so the game is
// playable out of the box — swap `src` for your real masters and the game
// world doesn't need any other changes.
export const album = {
  title: 'AFROBØØST',
  year: 2026,
}

export const tracks = [
  {
    title: 'Moonlight',
    duration: '2:20',
    src: '/audio/moonlight.mp3',
    color: '#fbff2a',
    description: 'COSMIC AFROBOOST',
  },
  {
    title: 'Mirage',
    duration: '3:12',
    src: '/audio/track-01.wav',
    color: '#f6a14b',
    description: 'Opens every set — a heat-shimmer of a hook about chasing a signal that isn’t really there.',
  },
  {
    title: 'Dune Static',
    duration: '2:47',
    src: '/audio/track-02.wav',
    color: '#e8735a',
    description: 'Drum machine left out under two suns. Written in one take, kept in one take.',
  },
  {
    title: 'Zero-G',
    duration: '4:03',
    src: '/audio/track-03.wav',
    color: '#c76a8f',
    description: 'The slow one. About running out of fuel a long way from anyone.',
  },
  {
    title: 'Caravan',
    duration: '3:34',
    src: '/audio/track-04.wav',
    color: '#8f6bd6',
    description: 'A road song for a road that doesn’t touch ground anymore.',
  },
  {
    title: 'Salt Flat Radio',
    duration: '3:58',
    src: '/audio/track-05.wav',
    color: '#5a8fe8',
    description: 'Recorded off a dead station still broadcasting. Written after a night of not sleeping.',
  },
  {
    title: 'Twin Moons',
    duration: '2:59',
    src: '/audio/track-06.wav',
    color: '#4bb99a',
    description: 'The closest thing to a love song on the record.',
  },
  {
    title: 'Vulture Hour',
    duration: '3:21',
    src: '/audio/track-07.wav',
    color: '#c9b23c',
    description: 'About watching something fall apart and not looking away.',
  },
  {
    title: 'Home, Eventually',
    duration: '4:41',
    src: '/audio/track-08.wav',
    color: '#e0995f',
    description: 'The last one. Recorded in a single take with the airlock open.',
  },
]
