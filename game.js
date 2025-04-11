// Проверка Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;

// Инициализация WebApp
if (tgWebApp) {
    tgWebApp.ready();
    tgWebApp.expand();
    document.documentElement.style.setProperty('--primary-color', '#0088cc');
    document.documentElement.style.setProperty('--secondary-color', '#3ac0ef');
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

function isSolvable(numbers) {
    let inversions = 0;
    for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            if (numbers[i] > numbers[j]) inversions++;
        }
    }
    return inversions % 2 === 0;
}

function renderBoard() {
    boardElement.innerHTML = '';
    tiles = [];
    
    board.forEach((row, i) => {
        row.forEach((value, j) => {
            const tile = document.createElement('div');
            tile.className = value === 0 ? 'tile empty' : 'tile';
            
            if (value !== 0) {
                tile.textContent = value;
                tile.dataset.row = i;
                tile.dataset.col = j;
                tile.addEventListener('click', () => handleTileClick(i, j));
                tile.style.animation = `tileAppear 0.3s ease ${(i * 4 + j) * 0.05}s both`;
            }
            
            boardElement.appendChild(tile);
            tiles.push(tile);
        });
    });
}

function handleTileClick(row, col) {
    if (!gameStarted || isAnimating || !canMove(row, col)) return;
    
    isAnimating = true;
    const tile = getTileAt(row, col);
    const emptyTile = getTileAt(emptyPos.row, emptyPos.col);
    
    // Сохраняем начальные позиции
    const startRow = row;
    const startCol = col;
    
    // Обновляем состояние доски
    board[emptyPos.row][emptyPos.col] = board[row][col];
    board[row][col] = 0;
    
    // Анимация перемещения
    tile.style.transition = `all ${ANIMATION.duration}ms ${ANIMATION.easing}`;
    tile.style.transform = `translate(${(emptyPos.col - col) * 100}%, ${(emptyPos.row - row) * 100}%)`;
    tile.style.zIndex = '10';
    
    setTimeout(() => {
        // Обновляем DOM
        tile.style.transform = 'translate(0, 0)';
        tile.dataset.row = emptyPos.row;
        tile.dataset.col = emptyPos.col;
        
        // Обновляем позицию пустой клетки
        emptyPos = { row: startRow, col: startCol };
        
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

function getTileAt(row, col) {
    return tiles.find(t => 
        parseInt(t.dataset.row) === row && 
        parseInt(t.dataset.col) === col
    );
}

function canMove(row, col) {
    return (
        (Math.abs(row - emptyPos.row) === 1 && col === emptyPos.col) ||
        (Math.abs(col - emptyPos.col) === 1 && row === emptyPos.row)
    );
}

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
        
        if (tgWebApp) {
            tgWebApp.sendData(`Победа за ${moves} ходов!`);
        }
    }
}

// Инициализация
newGameBtn.addEventListener('click', initGame);
document.addEventListener('DOMContentLoaded', initGame);