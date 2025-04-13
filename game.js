document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.body.classList.add('loaded');
    restoreGame() || initGame();
  }, 1000);
});

// Telegram WebApp
const tg = window.Telegram?.WebApp;
let userName = 'игрок';

if (tg) {
  tg.ready();
  tg.expand();

  const name = tg.initDataUnsafe?.user?.first_name;
  if (name) {
    userName = name;
    const greeting = document.getElementById("greeting");
    if (greeting) greeting.textContent = `Привет, ${userName}!`;
  }

  if (tg.themeParams?.bg_color?.includes('#') && tg.themeParams.bg_color !== '#ffffff') {
    document.body.classList.add("dark");
  }
}

// DOM
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

const soundWin = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_2d24f4a726.mp3"); // фанфары

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    const mins = String(Math.floor(timer / 60)).padStart(2, '0');
    const secs = String(timer % 60).padStart(2, '0');
    timerElement.textContent = `${mins}:${secs}`;
  }, 1000);
}

function saveGame() {
  const save = {
    board,
    emptyPos,
    moves,
    timer
  };
  localStorage.setItem("pyatnashki-save", JSON.stringify(save));
}

function restoreGame() {
  const saved = localStorage.getItem("pyatnashki-save");
  if (!saved) return false;
  try {
    const data = JSON.parse(saved);
    board = data.board;
    emptyPos = data.emptyPos;
    moves = data.moves;
    timer = data.timer;
    history = [];
    movesElement.textContent = moves;
    timerElement.textContent = '...'; // отрисуется через таймер
    messageElement.textContent = '';
    messageElement.style.opacity = '0';
    startTimer();
    createTiles();
    updateTilePositions();
    return true;
  } catch {
    return false;
  }
}

function initGame() {
  const numbers = Array.from({ length: 15 }, (_, i) => i + 1);
  do shuffle(numbers); while (!isSolvable(numbers));

  board = [];
  for (let i = 0; i < 4; i++) board.push(numbers.slice(i * 4, i * 4 + 4));
  board[3][3] = 0;
  emptyPos = { row: 3, col: 3 };
  moves = 0;
  history = [];
  movesElement.textContent = moves;
  messageElement.textContent = '';
  messageElement.style.opacity = '0';
  timer = 0;
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
      const tile = document.createElement('div');
      tile.className = 'tile';
      if (value === 0) {
        tile.classList.add('empty');
        continue;
      }
      tile.textContent = value;
      boardElement.appendChild(tile);
      tileElements[value] = tile;
      requestAnimationFrame(() => tile.classList.add('show'));
    }
  }
}

function updateTilePositions() {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const value = board[i][j];
      if (value === 0) continue;
      const tile = tileElements[value];
      if (!tile) continue;
      tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;
      tile.onclick = () => handleTileClick(i, j);
    }
  }
}

function handleTileClick(row, col) {
  if (isAnimating) return;

  const dr = Math.abs(row - emptyPos.row);
  const dc = Math.abs(col - emptyPos.col);
  if (dr + dc !== 1) return;

  const value = board[row][col];
  history.push({
    board: board.map(r => [...r]),
    emptyPos: { ...emptyPos }
  });

  board[emptyPos.row][emptyPos.col] = value;
  board[row][col] = 0;
  emptyPos = { row, col };
  moves++;
  movesElement.textContent = moves;

  isAnimating = true;
  updateTilePositions();
  setTimeout(() => {
    isAnimating = false;
    if (checkWin()) showVictory();
  }, 300);
}

function showVictory() {
  soundWin.play().catch(() => {}); // на всякий
  messageElement.textContent = `🎉 Поздравляем, ${userName}!`;
  messageElement.style.opacity = '1';
  localStorage.removeItem("pyatnashki-save");
}

function undoMove() {
  if (!history.length || isAnimating) return;
  const last = history.pop();
  board = last.board.map(r => [...r]);
  emptyPos = { ...last.emptyPos };
  moves--;
  movesElement.textContent = moves;
  updateTilePositions();
}

// автосохранение при уходе
window.addEventListener('beforeunload', saveGame);

// кнопки
newGameBtn?.addEventListener('click', initGame);
undoBtn?.addEventListener('click', undoMove);
