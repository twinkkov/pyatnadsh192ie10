// Проверка Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;

// Инициализация WebApp
if (tgWebApp) {
    tgWebApp.ready();
    tgWebApp.expand();
}

// Состояние игры
let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let gameStarted = false;
let isAnimating = false;

// DOM элементы
const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');

function isSolvable(numbers) {
    let inversions = 0;
    for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            if (numbers[i] > numbers[j]) inversions++;
        }
    }
    return inversions % 2 === 0;
}

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

    // Создаем контейнер для плиток
    const container = document.createElement('div');
    container.className = 'tiles-container';
    boardElement.appendChild(container);

    board.forEach((row, i) => {
        row.forEach((value, j) => {
            const tile = document.createElement('div');
            tile.className = value === 0 ? 'tile empty' : 'tile';

            if (value !== 0) {
                tile.textContent = value;
                tile.dataset.row = i;
                tile.dataset.col = j;
                tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;
                tile.addEventListener('click', () => handleTileClick(i, j));
            } else {
                tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;
            }

            container.appendChild(tile);
        });
    });
}

function checkWin() {
    const winningBoard = Array.from({ length: 15 }, (_, i) => i + 1).concat(0);
    const currentBoard = board.flat();

    if (currentBoard.every((value, index) => value === winningBoard[index])) {
        messageElement.textContent = 'Поздравляем! Вы выиграли!';
        gameStarted = false;
    }
}

function handleTileClick(row, col) {
    if (!gameStarted || isAnimating || !canMove(row, col)) return;

    isAnimating = true;
    const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);

    // Вычисляем направление движения
    const dx = emptyPos.col - col;
    const dy = emptyPos.row - row;

    // Применяем анимацию
    tile.style.transition = 'transform 0.3s ease-out';
    tile.style.transform = `translate(${(emptyPos.col) * 100}%, ${(emptyPos.row) * 100}%)`;

    setTimeout(() => {
        // Обновляем состояние
        board[emptyPos.row][emptyPos.col] = board[row][col];
        board[row][col] = 0;

        emptyPos = { row, col };
        moves++;
        movesElement.textContent = moves;

        renderBoard(); // Перерисовываем доску для обновления позиций

        setTimeout(() => {
            isAnimating = false;
            checkWin();
        }, 50);
    }, 300);
}

function canMove(row, col) {
    const dx = Math.abs(emptyPos.col - col);
    const dy = Math.abs(emptyPos.row - row);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

// Остальные функции остаются без изменений
// ...

newGameBtn.addEventListener('click', initGame);
document.addEventListener('DOMContentLoaded', initGame);