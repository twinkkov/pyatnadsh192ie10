const tgWebApp = window.Telegram?.WebApp;
if (tgWebApp) {
  tgWebApp.ready();
  tgWebApp.expand();

  if (tgWebApp.themeParams.bg_color?.includes('#') && tgWebApp.themeParams.bg_color !== '#ffffff') {
    document.body.classList.add("dark");
  }

  if (tgWebApp.initDataUnsafe?.user?.first_name) {
    document.getElementById("greeting").textContent = `Привет, ${tgWebApp.initDataUnsafe.user.first_name}!`;
  }
}

const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const timerElement = document.getElementById('timer');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');
const undoBtn = document.getElementById('undo');

let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let timer = 0;
let timerInterval;
let isAnimating = false;
let tileElements = {};
let history = [];

// 🔊 Звуки
const clickSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-click-1114.mp3');
const winSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bonus-earned-in-video-game-2058.mp3');
const errorSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3');

function startTimer() {
  clearInterval(timerInterval);
  timer = 0;
  timerInterval = setInterval(() => {
    timer++;
    const mins = String(Math.floor(timer / 60)).padStart(2, '0');
    const secs = String(timer % 60).padStart(2, '0');
    timerElement.textContent = `${mins}:${secs}`;
  }, 1000);
}

function initGame() {
  const numbers = Array.from({ length: 15 }, (_, i) => i + 1);
  do shuffle(numbers);
  while (!isSolvable(numbers));

  board = [];
  for (let i = 0; i < 4; i++) board.push(numbers.slice(i * 4, i * 4 + 4));
  board[3][3] = 0;
  emptyPos = { row: 3, col: 3 };
  moves = 0;
  history = [];
  movesElement.textContent = moves;
  messageElement.textContent = '';
  startTimer();
  createTiles();
  updateTilePositions();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function isSolvable(numbers) {
  let inv = 0;
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] > numbers[j]) inv++;
    }
  }
  return inv % 2 === 0;
}

function createTiles() {
  boardElement.innerHTML = '';
  tileElements = {};
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const value = board[i][j];
      if (value === 0) continue;
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.textContent = value;
      boardElement.appendChild(tile);
      tileElements[value] = tile;
    }
  }
}

function updateTilePositions() {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const value = board[i][j];
      if (value === 0) continue;
      const tile = tileElements[value];
      tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;
      tile.onclick = () => handleTileClick(i, j);
    }
  }
}

function handleTileClick(row, col) {
  if (isAnimating) return;

  const dr = Math.abs(row - emptyPos.row);
  const dc = Math.abs(col - emptyPos.col);
  if (dr + dc !== 1) {
    errorSound.play();
    return;
  }

  const value = board[row][col];
  history.push({
    board: board.map(row => [...row]),
    emptyPos: { ...emptyPos }
  });

  board[emptyPos.row][emptyPos.col] = value;
  board[row][col] = 0;
  emptyPos = { row, col };
  moves++;
  movesElement.textContent = moves;

  clickSound.currentTime = 0;
  clickSound.play();

  isAnimating = true;
  const tile = tileElements[value];
  tile.classList.add('bounce');
  setTimeout(() => {
    tile.classList.remove('bounce');
    updateTilePositions();
    isAnimating = false;
    if (checkWin()) winSequence();
  }, 300);
}

function undoMove() {
  if (!history.length || isAnimating) return;
  const last = history.pop();
  board = last.board.map(row => [...row]);
  emptyPos = { ...last.emptyPos };
  moves--;
  movesElement.textContent = moves;
  updateTilePositions();
}

function checkWin() {
  const flat = board.flat();
  for (let i = 0; i < 15; i++) {
    if (flat[i] !== i + 1) return false;
  }
  return true;
}

// ✅ Обновлённая победная анимация
function winSequence() {
  clearInterval(timerInterval);
  messageElement.textContent = '🎉 Победа!';
  winSound.play();

  const tiles = Object.values(tileElements);

  tiles.forEach(tile => {
    tile.style.transition = 'none'; // отключаем transition для моментального эффекта
    const dx = (Math.random() * 2 - 1) * 500;
    const dy = (Math.random() * 2 - 1) * 500;
    tile.style.transform = `translate(${dx}px, ${dy}px) rotate(720deg) scale(0.5)`;
    tile.style.opacity = '0';
  });

  // Через 1.2с сбрасываем всё
  setTimeout(() => {
    tiles.forEach(tile => {
      tile.style.transition = '';
      tile.style.transform = '';
      tile.style.opacity = '';
    });
  }, 1200);
}

newGameBtn.onclick = initGame;
undoBtn.onclick = undoMove;
document.addEventListener('DOMContentLoaded', initGame);
