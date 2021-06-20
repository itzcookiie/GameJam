import { gameState, gameStates, gameInit, createGridObjects } from './index.js';

const playBtn = document.getElementById('play');
const restartBtn = document.getElementById('restart');
const gameMenu = document.querySelector('.game-menu');
const body = document.querySelector('body');

playBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

function startGame() {
    body.classList.remove('MAIN_MENU');
    body.classList.add('PLAY');
    createGridObjects();
    gameInit();
}

function restartGame() {
    body.classList.remove('GAME_OVER');
    body.classList.add('PLAY');
    gameInit();
}