// Инициализация Telegram WebApp
window.Telegram.WebApp.expand();

// Игровые переменные
let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let gameStarted = false;

// Элементы DOM
const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');

// Инициализация игры
function initGame() {
    // Создаем массив чисел от 1 до 15
    let numbers = Array.from({ length: 15 }, (_, i) => i + 1);
    
    // Перемешиваем числа
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    // Создаем игровое поле 4x4
    board = [];
    for (let i = 0; i < 4; i++) {
        board[i] = [];
        for (let j = 0; j < 4; j++) {
            const index = i * 4 + j;
            if (index < 15) {
                board[i][j] = numbers[index];
            } else {
                board[i][j] = 0; // 0 - пустая клетка
                emptyPos = { row: i, col: j };
            }
        }
    }
    
    // Проверяем, можно ли решить эту комбинацию
    if (!isSolvable()) {
        // Если нельзя - перемешиваем еще раз
        initGame();
        return;
    }
    
    moves = 0;
    gameStarted = true;
    updateView();
}

// Проверка, можно ли решить текущую комбинацию
function isSolvable() {
    let inversions = 0;
    const flatBoard = board.flat().filter(num => num !== 0);
    
    for (let i = 0; i < flatBoard.length; i++) {
        for (let j = i + 1; j < flatBoard.length; j++) {
            if (flatBoard[i] > flatBoard[j]) {
                inversions++;
            }
        }
    }
    
    // Для поля 4x4 решение существует, если:
    // (инверсий четно и пустая клетка в четной строке снизу) ИЛИ
    // (инверсий нечетно и пустая клетка в нечетной строке снизу)
    const emptyRowFromBottom = 4 - emptyPos.row;
    return (inversions % 2 === 0) === (emptyRowFromBottom % 2 === 0);
}

// Обновление отображения игры
function updateView() {
    boardElement.innerHTML = '';
    movesElement.textContent = `Ходы: ${moves}`;
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = document.createElement('div');
            const value = board[i][j];
            
            if (value === 0) {
                tile.className = 'tile empty';
            } else {
                tile.className = 'tile';
                tile.textContent = value;
                tile.addEventListener('click', () => moveTile(i, j));
            }
            
            boardElement.appendChild(tile);
        }
    }
    
    checkWin();
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
        messageElement.textContent = `Победа! Ходов: ${moves}`;
        gameStarted = false;
        window.Telegram.WebApp.sendData(`Пятнашки решены за ${moves} ходов`);
    }
}

// Перемещение плитки
function moveTile(row, col) {
    if (!gameStarted) return;
    
    // Проверяем, можно ли переместить плитку
    if (
        (Math.abs(row - emptyPos.row) === 1 && col === emptyPos.col) ||
        (Math.abs(col - emptyPos.col) === 1 && row === emptyPos.row)
    ) {
        // Меняем местами плитку и пустую клетку
        board[emptyPos.row][emptyPos.col] = board[row][col];
        board[row][col] = 0;
        emptyPos = { row, col };
        moves++;
        updateView();
    }
}

// Новая игра
newGameBtn.addEventListener('click', () => {
    messageElement.textContent = '';
    initGame();
});

// Запускаем игру при загрузке
initGame();