// Проверка Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;

// Инициализация WebApp
if (tgWebApp) {
    tgWebApp.expand();
    tgWebApp.enableClosingConfirmation();
    
    // Изменяем цветовую схему под Telegram
    document.documentElement.style.setProperty('--primary-color', '#0088cc');
    document.documentElement.style.setProperty('--secondary-color', '#00aced');
    document.documentElement.style.setProperty('--accent-color', '#ff6b81');
}

// Игровые переменные
let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let gameStarted = false;

// DOM элементы
const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');

// Инициализация игры
function initGame() {
    // Создаем и перемешиваем числа
    let numbers = Array.from({ length: 15 }, (_, i) => i + 1);
    
    // Гарантированно решаемая перестановка
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
    updateView();
}

// Проверка решаемости комбинации
function isSolvable(numbers) {
    let inversions = 0;
    for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            if (numbers[i] > numbers[j]) inversions++;
        }
    }
    return inversions % 2 === 0;
}

// Обновление интерфейса
function updateView() {
    movesElement.textContent = moves;
    boardElement.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const value = board[i][j];
            const tile = document.createElement('div');
            
            if (value === 0) {
                tile.className = 'tile empty';
            } else {
                tile.className = 'tile';
                tile.textContent = value;
                
                tile.addEventListener('click', () => {
                    if (gameStarted) {
                        moveTile(i, j);
                    }
                });
            }
            
            boardElement.appendChild(tile);
        }
    }
    
    checkWin();
}

// Перемещение плитки
function moveTile(row, col) {
    if (isAdjacent(row, col, emptyPos.row, emptyPos.col)) {
        // Анимация только перемещаемой плитки
        const movingTile = document.querySelector(`.tile:nth-child(${row * 4 + col + 1})`);
        movingTile.style.transition = 'transform 0.2s ease';
        movingTile.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            // Обновляем состояние доски
            board[emptyPos.row][emptyPos.col] = board[row][col];
            board[row][col] = 0;
            emptyPos = { row, col };
            
            moves++;
            updateView();
            
            // Сбрасываем анимацию
            movingTile.style.transform = 'scale(1)';
        }, 200);
    }
}

// Проверка соседства клеток
function isAdjacent(row1, col1, row2, col2) {
    return (
        (Math.abs(row1 - row2) === 1 && col1 === col2) ||
        (Math.abs(col1 - col2) === 1 && row1 === row2)
    );
}

// Проверка победы
function checkWin() {
    let counter = 1;
    let isWin = true;
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (i === 3 && j === 3) {
                if (board[i][j] !== 0) isWin = false;
            } else {
                if (board[i][j] !== counter) isWin = false;
                counter++;
            }
        }
    }
    
    if (isWin && gameStarted) {
        gameStarted = false;
        messageElement.textContent = `Победа! Ходов: ${moves}`;
        
        if (tgWebApp) {
            tgWebApp.sendData(`Победа за ${moves} ходов!`);
        }
    }
}

// Обработчики событий
newGameBtn.addEventListener('click', initGame);

// Запуск игры
document.addEventListener('DOMContentLoaded', initGame);