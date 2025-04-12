// Telegram WebApp support
const tgWebApp = window.Telegram && window.Telegram.WebApp;
if (tgWebApp) {
  tgWebApp.ready();
  tgWebApp.expand();
}

let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let isAnimating = false;
const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');
let tileElements = {};

function initGame() {
  const numbers = Array.from({ length: 15 }, (_, i) => i + 1);
  do {
    shuffle(numbers);
  } while (!isSolvable(numbers));

  // Инициализируем поле 4x4
  board = [];
  for (let i = 0; i < 4; i++) {
    board.push(numbers.slice(i * 4, i * 4 + 4));
  }
  board[3][3] = 0;
  emptyPos = { row: 3, col: 3 };
  moves = 0;
  movesElement.textContent = moves;
  messageElement.textContent = '';

  // Создаем плитки
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
      tile.dataset.value = value;
      tile.addEventListener('click', () => handleTileClick(i, j));
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

      // ⬇ ОБНОВЛЯЕМ ПОЗИЦИЮ ПЛИТКИ
      tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;

      // ⬇ ОБНОВЛЯЕМ ОБРАБОТЧИК КЛИКА
      tile.onclick = () => handleTileClick(i, j);
    }
  }
}

function handleTileClick(row, col) {
  if (isAnimating) return;

  const dr = Math.abs(row - emptyPos.row);
  const dc = Math.abs(col - emptyPos.col);

  if ((dr + dc) !== 1) return;

  const value = board[row][col];

  // Обновляем игровое поле
  board[emptyPos.row][emptyPos.col] = value;
  board[row][col] = 0;

  // Двигаем плитку
  emptyPos = { row, col };
  moves++;
  movesElement.textContent = moves;

  isAnimating = true;
  updateTilePositions();

  setTimeout(() => {
    isAnimating = false;
    if (checkWin()) {
      messageElement.textContent = 'Поздравляем! Вы выиграли!';
    }
  }, 310); // на 10мс больше, чем CSS transition
}

function checkWin() {
  const flat = board.flat();
  for (let i = 0; i < 15; i++) {
    if (flat[i] !== i + 1) return false;
  }
  return true;
}

newGameBtn.addEventListener('click', initGame);
document.addEventListener('DOMContentLoaded', initGame);
