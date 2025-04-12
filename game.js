// Проверка наличия Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;
if (tgWebApp) {
  tgWebApp.ready();
  tgWebApp.expand();
}

let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let isMoving = false;       // блокируем ходы во время анимации
let tileElements = {};      // сохраняем DOM-элементы плиток: {число: DOMElement}

const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');

function initGame() {
  const numbers = Array.from({ length: 15 }, (_, i) => i + 1);
  do {
    shuffle(numbers);
  } while (!isSolvable(numbers));

  board = [];
  for (let i = 0; i < 4; i++) {
    board.push(numbers.slice(i * 4, i * 4 + 4));
  }
  board[3][3] = 0; // Обозначаем пустую клетку
  emptyPos = { row: 3, col: 3 };
  moves = 0;
  movesElement.textContent = moves;
  messageElement.textContent = '';

  // Создаем плитки один раз, без полного перерендера после каждого хода
  createTiles();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function isSolvable(numbers) {
  let inversions = 0;
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] > numbers[j]) inversions++;
    }
  }
  return inversions % 2 === 0;
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
      // Первоначальное позиционирование: смещаем плитку по координатам (j, i)
      tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;
      tile.addEventListener('click', () => handleTileClick(i, j));
      boardElement.appendChild(tile);

      tileElements[value] = tile;
    }
  }
}

function handleTileClick(row, col) {
  // Если в данный момент идет анимация или плитка не соседняя – выходим
  if (isMoving || Math.abs(emptyPos.row - row) + Math.abs(emptyPos.col - col) !== 1) return;

  isMoving = true;
  const tileValue = board[row][col];

  // Обновляем игровое поле: перемещаем плитку в пустую клетку
  board[emptyPos.row][emptyPos.col] = tileValue;
  board[row][col] = 0;

  const oldEmptyPos = { ...emptyPos };
  emptyPos = { row, col };
  moves++;
  movesElement.textContent = moves;

  const movingTile = tileElements[tileValue];

  // Используем requestAnimationFrame для гарантированного перехода
  requestAnimationFrame(() => {
    movingTile.style.transform = `translate(${col * 100}%, ${row * 100}%)`;
  });

  // По окончании анимации (300 мс) снимаем блокировку и проверяем победу
  setTimeout(() => {
    isMoving = false;
    if (checkWin()) {
      messageElement.textContent = 'Поздравляем! Вы выиграли!';
    }
  }, 300);
}

function checkWin() {
  const flatBoard = board.flat();
  for (let i = 0; i < 15; i++) {
    if (flatBoard[i] !== i + 1) return false;
  }
  return true;
}

newGameBtn.addEventListener('click', initGame);
document.addEventListener('DOMContentLoaded', initGame);
