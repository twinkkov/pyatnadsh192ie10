// Проверка Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;

// Инициализация WebApp
if (tgWebApp) {
    tgWebApp.ready();
    tgWebApp.expand();
}

// Настройки анимации
const ANIMATION = {
    duration: 300,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
};

// Состояние игры
let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let gameStarted = false;
let isAnimating = false;
let tiles = [];

// DOM элементы
const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');

// Инициализация игры
function initGame() {
    // Создаем и перемешиваем числа
    let numbers = Array.from({ length: 15 }, (_, i) => i + 1);
    
    do {
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
    } while (!isSolvable(numbers));
    
    // Заполняем доску
    board = [];
    for (let i = 0; i < 4; i++) {
        board[i] = [];
        for (let j = 0; j < 4; j++) {
            const index = i * 4 + j;
            if (index < 15) {
                board[i][j] = numbers[index];
            } else {
                board[i][j] = 0;
                emptyPos = { row: i, col: j };
            }
        }
    }
    
    moves = 0;
    gameStarted = true;
    messageElement.textContent = '';
    renderBoard();
}

function renderBoard() {
    boardElement.innerHTML = '';
    tiles = [];
    
    // Создаем контейнер для плиток
    const tilesContainer = document.createElement('div');
    tilesContainer.className = 'tiles-container';
    boardElement.appendChild(tilesContainer);
    
    // Создаем сетку для позиционирования
    const grid = document.createElement('div');
    grid.className = 'tiles-grid';
    tilesContainer.appendChild(grid);
    
    board.forEach((row, i) => {
        row.forEach((value, j) => {
            const tile = document.createElement('div');
            tile.className = value === 0 ? 'tile empty' : 'tile';
            
            if (value !== 0) {
                tile.textContent = value;
                tile.dataset.row = i;
                tile.dataset.col = j;
                tile.addEventListener('click', () => handleTileClick(i, j));
                
                // Позиционирование
                tile.style.gridRow = i + 1;
                tile.style.gridColumn = j + 1;
            }
            
            grid.appendChild(tile);
            tiles.push(tile);
        });
    });
}

function handleTileClick(row, col) {
    if (!gameStarted || isAnimating || !canMove(row, col)) return;
    
    isAnimating = true;
    const tile = getTileAt(row, col);
    
    // Запоминаем начальную позицию
    const startX = col;
    const startY = row;
    
    // Вычисляем смещение
    const dx = emptyPos.col - col;
    const dy = emptyPos.row - row;
    
    // Применяем анимацию
    tile.style.transition = `transform ${ANIMATION.duration}ms ${ANIMATION.easing}`;
    tile.style.transform = `translate(${dx * 100}%, ${dy * 100}%)`;
    tile.style.zIndex = '10';
    
    // Обновляем состояние доски
    board[emptyPos.row][emptyPos.col] = board[row][col];
    board[row][col] = 0;
    
    setTimeout(() => {
        // Обновляем DOM
        tile.style.transform = 'translate(0, 0)';
        tile.dataset.row = emptyPos.row;
        tile.dataset.col = emptyPos.col;
        tile.style.gridRow = emptyPos.row + 1;
        tile.style.gridColumn = emptyPos.col + 1;
        
        // Обновляем позицию пустой клетки
        emptyPos = { row, col };
        
        moves++;
        movesElement.textContent = moves;
        
        setTimeout(() => {
            tile.style.transition = '';
            tile.style.zIndex = '';
            isAnimating = false;
            checkWin();
        }, ANIMATION.duration);
    }, ANIMATION.duration);
}

// Остальные вспомогательные функции остаются без изменений
// ...

newGameBtn.addEventListener('click', initGame);
document.addEventListener('DOMContentLoaded', initGame);