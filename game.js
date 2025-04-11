// Проверка Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;

// Инициализация WebApp
if (tgWebApp) {
    tgWebApp.ready();
    tgWebApp.expand();
    
    // Адаптация цветов под Telegram
    document.documentElement.style.setProperty('--primary-color', '#0088cc');
    document.documentElement.style.setProperty('--secondary-color', '#3ac0ef');
}

// Константы
const MOVE_ANIMATION_DURATION = 200;

// Состояние игры
let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let gameStarted = false;
let isAnimating = false;
let tileElements = [];

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
    renderInitialBoard();
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

// Рендер начальной доски
function renderInitialBoard() {
    boardElement.innerHTML = '';
    tileElements = [];

    board.forEach((row, i) => {
        row.forEach((value, j) => {
            const tile = document.createElement('div');
            tile.className = value === 0 ? 'tile empty' : 'tile';
            tile.dataset.row = i;
            tile.dataset.col = j;

            if (value !== 0) {
                tile.textContent = value;
                tile.addEventListener('click', () => handleTileClick(i, j));

                // Анимация появления
                tile.style.animation = `tileAppear ${MOVE_ANIMATION_DURATION}ms ease-out`;
                tile.style.animationDelay = `${(i * 4 + j) * 30}ms`;
            }

            boardElement.appendChild(tile);
            tileElements.push(tile);
        });
    });
}

// Рендер доски
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
            }
            
            boardElement.appendChild(tile);
        });
    });
    
    checkWin();
}

// Обработка клика с анимацией
function handleTileClick(row, col) {
    if (!gameStarted || isAnimating || !isAdjacent(row, col, emptyPos.row, emptyPos.col)) return;

    isAnimating = true;
    const movingTile = tileElements.find(t => 
        parseInt(t.dataset.row) === row && 
        parseInt(t.dataset.col) === col
    );

    // Рассчитываем направление движения
    const direction = {
        x: emptyPos.col - col,
        y: emptyPos.row - row
    };

    // Применяем анимацию
    movingTile.style.transition = `transform ${MOVE_ANIMATION_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    movingTile.style.transform = `translate(${direction.x * 100}%, ${direction.y * 100}%)`;
    movingTile.style.zIndex = '10';

    setTimeout(() => {
        // Обновляем данные
        board[emptyPos.row][emptyPos.col] = board[row][col];
        board[row][col] = 0;

        // Обновляем DOM без перерисовки
        movingTile.style.transform = 'translate(0, 0)';
        movingTile.style.zIndex = '';
        movingTile.dataset.row = emptyPos.row;
        movingTile.dataset.col = emptyPos.col;

        emptyPos = { row, col };
        moves++;
        movesElement.textContent = moves;

        setTimeout(() => {
            movingTile.style.transition = '';
            isAnimating = false;
            checkWin();
        }, MOVE_ANIMATION_DURATION);
    }, MOVE_ANIMATION_DURATION);
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
        
        if (tgWebApp) {
            tgWebApp.sendData(`Победа за ${moves} ходов!`);
        }
    }
}

// Инициализация
newGameBtn.addEventListener('click', initGame);
document.addEventListener('DOMContentLoaded', initGame);