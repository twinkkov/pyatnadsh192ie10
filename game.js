document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.body.classList.add('loaded');
    applySavedTheme();
    restoreGame() || initGame();
  }, 1000);
});

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
}

const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const timerElement = document.getElementById('timer');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');
const undoBtn = document.getElementById('undo');
const coinsElement = document.getElementById('coins');
const sizeSelector = document.getElementById('size-selector');
const themeToggle = document.getElementById('toggle-theme');

let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let timer = 0;
let timerInterval;
let isAnimating = false;
let tileElements = {};
let history = [];
let size = +localStorage.getItem("size") || 4;
let coins = +localStorage.getItem("coins") || 0;

const soundWin = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_2d24f4a726.mp3");

function updateCoinsDisplay() {
  coinsElement.textContent = coins;
  localStorage.setItem("coins", coins);
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    const mins = String(Math.floor(timer / 60)).padStart(2, '0');
    const secs = String(timer % 60).padStart(2, '0');
    timerElement.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function saveGame() {
  const save = { board, emptyPos, moves, timer, size };
  localStorage.setItem("pyatnashki-save", JSON.stringify(save));
}

function restoreGame() {
  const saved = localStorage.getItem("pyatnashki-save");
  if (!saved) return false;
  try {
    const data = JSON.parse(saved);
    size = data.size || 4;
    sizeSelector.value = size;
    board = data.board;
    emptyPos = data.emptyPos;
    moves = data.moves;
    timer = data.timer;
    history = [];
    movesElement.textContent = moves;
    messageElement.textContent = '';
    messageElement.style.opacity = '0';
    startTimer();
    createTiles();
    updateTilePositions();
    updateCoinsDisplay();
    return true;
  } catch {
    return false;
  }
}

function initGame() {
  const total = size * size - 1;
  const numbers = Array.from({ length: total }, (_, i) => i + 1);
  do shuffle(numbers); while (!isSolvable(numbers));

  board = [];
  for (let i = 0; i < size; i++) board.push(numbers.slice(i * size, i * size + size));
  board[size - 1][size - 1] = 0;
  emptyPos = { row: size - 1, col: size - 1 };
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
  const tileSize = 100 / size + '%';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const value = board[i][j];
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.width = tileSize;
      tile.style.height = tileSize;
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
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const value = board[i][j];
      if (value === 0) continue;
      const tile = tileElements[value];
      if (!tile) continue;
      tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;
      tile.onclick = () => handleTileClick(i, j);

      let startX, startY;
      tile.ontouchstart = (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
      };
      tile.ontouchend = (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 30 && canMove(i, j + 1)) handleTileClick(i, j);
          else if (dx < -30 && canMove(i, j - 1)) handleTileClick(i, j);
        } else {
          if (dy > 30 && canMove(i + 1, j)) handleTileClick(i, j);
          else if (dy < -30 && canMove(i - 1, j)) handleTileClick(i, j);
        }
      };
    }
  }
}

function canMove(row, col) {
  return row === emptyPos.row && col === emptyPos.col;
}

function handleTileClick(row, col) {
  if (isAnimating) return;
  const dr = Math.abs(row - emptyPos.row);
  const dc = Math.abs(col - emptyPos.col);
  if (dr + dc !== 1) return;

  const value = board[row][col];
  history.push({ board: board.map(r => [...r]), emptyPos: { ...emptyPos } });
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
  stopTimer();
  soundWin.play().catch(() => {});
  messageElement.textContent = `🎉 Победа, ${userName}!`;
  messageElement.style.opacity = '1';
  coins += 10;
  updateCoinsDisplay();
  localStorage.removeItem("pyatnashki-save");
}

function checkWin() {
  const flat = board.flat();
  for (let i = 0; i < flat.length - 1; i++) {
    if (flat[i] !== i + 1) return false;
  }
  return flat[flat.length - 1] === 0;
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

function applySavedTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark', theme === 'dark');
}

themeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
});

sizeSelector?.addEventListener('change', () => {
  size = parseInt(sizeSelector.value);
  localStorage.setItem("size", size);
  initGame();
});

window.addEventListener('beforeunload', saveGame);
newGameBtn?.addEventListener('click', initGame);
undoBtn?.addEventListener('click', undoMove);
