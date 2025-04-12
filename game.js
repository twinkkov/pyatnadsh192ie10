// Проверка наличия Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;
if (tgWebApp) {
  tgWebApp.ready();
  tgWebApp.expand();
}

let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let isMoving = false;       // блокировка во время анимации
let tileElements = {};      // отображаемые плитки: {число: DOMElement}

const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');

function initGame() {
  // Генерация массива номеров 1...15
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

  // Создание плиток один раз, без полного перерендера после каждого хода
  createTiles();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Простая проверка решаемости (по числу инверсий)
function isSolvable(numbers) {
  let inversions = 0;
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] > numbers[j]) inversions++;
    }
  }
  return inversions % 2 === 0;
}

// Создание плиток на поле на основе объекта board
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
      // Первоначальное абсолютное позиционирование по расчету (j * 100%, i * 100%)
      tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;
      tile.addEventListener('click', () => handleTileClick(i, j));
      boardElement.appendChild(tile);
      
      tileElements[value] = tile;
    }
  }
}

// Обработчик клика по плитке
function handleTileClick(row, col) {
  // Если сейчас анимация – игнорируем клик
  if (isMoving) return;
  
  // Проверяем, находится ли плитка рядом с пустой клеткой
  if (Math.abs(emptyPos.row - row) + Math.abs(emptyPos.col - col) !== 1) return;
  
  isMoving = true;
  
  const tileValue = board[row][col];
  // Обновляем внутреннее игровое поле: перемещаем значение плитки в пустую клетку
  board[emptyPos.row][emptyPos.col] = tileValue;
  board[row][col] = 0;
  
  const oldEmptyPos = { ...emptyPos };
  emptyPos = { row, col };
  moves++;
  movesElement.textContent = moves;
  
  // Находим DOM-элемент плитки по значению
  const movingTile = tileElements[tileValue];
  // Обновляем позицию плитки (плавно благодаря transition в CSS)
  movingTile.style.transform = `translate(${col * 100}%, ${row * 100}%)`;
  
  // Ждем окончания анимации, прежде чем разблокировать клики
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
