// Проверка Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;

// Инициализация WebApp
if (tgWebApp) {
    tgWebApp.expand();
    tgWebApp.enableClosingConfirmation();
    
    // Адаптация цветов под Telegram
    document.documentElement.style.setProperty('--primary-color', '#0088cc');
    document.documentElement.style.setProperty('--secondary-color', '#00aced');
    document.documentElement.style.setProperty('--accent-color', '#ff6b81');
}

// Конфигурация анимаций
const ANIMATION_CONFIG = {
    tileMove: 150, // ms
    tilePress: 100, // ms
    winCelebration: 300 // ms
};

// Игровые переменные
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
    renderBoard();
}

// Проверка решаемости
function isSolvable(numbers) {
    let inversions = 0;
    for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            if (numbers[i] > numbers[j]) inversions++;
        }
    }
    return inversions % 2 === 0;
}

// Рендер доски с анимациями
function renderBoard() {
    movesElement.textContent = moves;
    boardElement.innerHTML = '';
    
    board.forEach((row, i) => {
        row.forEach((value, j) => {
            const tile = document.createElement('div');
            tile.className = value === 0 ? 'tile empty' : 'tile';
            
            if (value !== 0) {
                tile.textContent = value;
                tile.addEventListener('click', () => handleTileClick(i, j));
                
                // Плавное появление
                tile.style.animation = `tileAppear ${ANIMATION_CONFIG.tileMove}ms ease-out`;
                tile.style.animationDelay = `${(i * 4 + j) * 20}ms`;
            }
            
            boardElement.appendChild(tile);
        });
    });
    
    checkWin();
}

// Обработка клика
function handleTileClick(row, col) {
    if (!gameStarted || isAnimating || !isAdjacent(row, col, emptyPos.row, emptyPos.col)) return;
    
    isAnimating = true;
    const tile = document.querySelector(`.tile:nth-child(${row * 4 + col + 1})`);
    
    // Анимация нажатия
    tile.style.transform = 'scale(0.92)';
    tile.style.transition = `transform ${ANIMATION_CONFIG.tilePress}ms ease`;
    
    setTimeout(() => {
        // Обновляем состояние
        board[emptyPos.row][emptyPos.col] = board[row][col];
        board[row][col] = 0;
        emptyPos = { row, col };
        moves++;
        
        // Анимация перемещения
        tile.style.transform = 'translate3d(0, 0, 0)';
        tile.style.transition = `transform ${ANIMATION_CONFIG.tileMove}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        
        setTimeout(() => {
            renderBoard();
            isAnimating = false;
        }, ANIMATION_CONFIG.tileMove);
    }, ANIMATION_CONFIG.tilePress);
}

// Проверка соседства
function isAdjacent(row1, col1, row2, col2) {
    return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
           (Math.abs(col1 - col2) === 1 && row1 === row2);
}

// Проверка победы
function checkWin() {
    let counter = 1;
    let isWin = true;
    
    board.forEach((row, i) => {
        row.forEach((value, j) => {
            if (i === 3 && j === 3) {
                if (value !== 0) isWin = false;
            } else if (value !== counter) {
                isWin = false;
            }
            counter++;
        });
    });
    
    if (isWin && gameStarted) {
        gameStarted = false;
        messageElement.textContent = `Победа! Ходов: ${moves}`;
        celebrateWin();
        
        if (tgWebApp) {
            tgWebApp.sendData(`Победа за ${moves} ходов!`);
        }
    }
}

// Анимация победы
function celebrateWin() {
    const tiles = document.querySelectorAll('.tile:not(.empty)');
    
    tiles.forEach((tile, i) => {
        tile.style.animation = `celebrate ${ANIMATION_CONFIG.winCelebration}ms cubic-bezier(0.68, -0.6, 0.32, 1.6) both`;
        tile.style.animationDelay = `${i * 50}ms`;
    });
}

// Инициализация
newGameBtn.addEventListener('click', initGame);
document.addEventListener('DOMContentLoaded', initGame);