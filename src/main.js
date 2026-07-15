import { Game } from './game/game.js'

const canvas = document.getElementById('game-canvas')
const game = new Game(canvas)

const titleScreen = document.getElementById('title-screen')
const startBtn = document.getElementById('start-btn')

function enterDesert() {
  titleScreen.classList.add('hidden')
  game.start()
}

startBtn.addEventListener('click', enterDesert, { once: true })
