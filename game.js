// Проверка Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;

// Инициализация WebApp
if (tgWebApp) {
    tgWebApp.ready();
    tgWebApp.expand();
}

let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;

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
    board[3][3] = 0;
    emptyPos = { row: 3, col: 3 };
    moves = 0;
    movesElement.textContent = moves;
    messageElement.textContent = '';
    renderBoard();
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

function renderBoard() {
    boardElement.innerHTML = '';
    board.forEach((row, i) => {
        row.forEach((value, j) => {
            const tile = document.createElement('div');
            tile.className = value === 0 ? 'tile empty' : 'tile';
            if (value !== 0) tile.textContent = value;
            tile.addEventListener('click', () => handleTileClick(i, j));
            boardElement.appendChild(tile);
        });
    });
}

function handleTileClick(row, col) {
    if (Math.abs(emptyPos.row - row) + Math.abs(emptyPos.col - col) === 1) {
        board[emptyPos.row][emptyPos.col] = board[row][col];
        board[row][col] = 0;
        emptyPos = { row, col };
        moves++;
        movesElement.textContent = moves;
        renderBoard();
        if (checkWin()) {
            messageElement.textContent = 'Поздравляем! Вы выиграли!';
        }
    }
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