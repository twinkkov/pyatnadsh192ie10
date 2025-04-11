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
let isAnimating = false;

// DOM элементы
const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');
const loadingScreen = document.getElementById('loading');

// Инициализация игры
function initGame() {
    showLoading();
    
    // Имитация загрузки для плавного старта
    setTimeout(() => {
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
        updateView();
        hideLoading();
    }, 800);
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
                tile.style.animationDelay = `${(i * 4 + j) * 0.05}s`;
                
                tile.addEventListener('click', () => {
                    if (!isAnimating && gameStarted) {
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
        isAnimating = true;
        
        // Анимация перемещения
        const tile = document.querySelector(`.tile:nth-child(${row * 4 + col + 1})`);
        tile.style.transform = 'scale(0.9)';
        tile.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            // Обновляем состояние доски
            board[emptyPos.row][emptyPos.col] = board[row][col];
            board[row][col] = 0;
            
            // Обновляем позицию пустой клетки
            emptyPos = { row, col };
            
            moves++;
            updateView();
            isAnimating = false;
        }, 300);
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
        
        // Эффект победы
        document.querySelectorAll('.tile:not(.empty)').forEach((tile, index) => {
            tile.style.animation = `celebrate 0.5s ease ${index * 0.1}s both`;
        });
        
        // Добавляем временный стиль для анимации
        const style = document.createElement('style');
        style.textContent = `
            @keyframes celebrate {
                0% { transform: scale(1); background: var(--tile-color); }
                50% { transform: scale(1.2); background: var(--success-color); }
                100% { transform: scale(1); background: var(--tile-color); }
            }
        `;
        document.head.appendChild(style);
        
        if (tgWebApp) {
            tgWebApp.sendData(`Победа за ${moves} ходов!`);
        }
    }
}

// Управление загрузкой
function showLoading() {
    loadingScreen.style.display = 'flex';
}

function hideLoading() {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        loadingScreen.style.opacity = '1';
    }, 300);
}

// Обработчики событий
newGameBtn.addEventListener('click', initGame);

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGame, 500);
});