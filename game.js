// Проверка наличия Telegram WebApp
const tgWebApp = window.Telegram && window.Telegram.WebApp;
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
    board[3][3] = 0; // Обозначаем пустую клетку
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

// Проверка на решаемость пазла
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

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const value = board[i][j];
            if (value === 0) continue; // Пропускаем пустую клетку

            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.textContent = value;
            // Абсолютное позиционирование через transform (сдвиг на j и i клеток)
            tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;
            tile.addEventListener('click', () => handleTileClick(i, j));
            boardElement.appendChild(tile);
        }
    }
}

function handleTileClick(row, col) {
    // Если плитка рядом с пустым местом (по горизонтали или вертикали)
    if (Math.abs(emptyPos.row - row) + Math.abs(emptyPos.col - col) === 1) {
        const tileValue = board[row][col];

        // Обновляем массив игрового поля: меняем местами значение плитки и пустой клетки
        board[emptyPos.row][emptyPos.col] = tileValue;
        board[row][col] = 0;

        // Запоминаем старую позицию пустой клетки
        const oldEmptyPos = { ...emptyPos };
        emptyPos = { row, col };
        moves++;
        movesElement.textContent = moves;

        // Находим плитку, которая была нажата
        const tiles = Array.from(boardElement.children);
        const movingTile = tiles.find(t => parseInt(t.textContent) === tileValue);
        if (movingTile) {
            // Перемещаем плитку: сначала сдвигаем её в позицию предыдущей пустой клетки
            movingTile.style.transform = `translate(${oldEmptyPos.col * 100}%, ${oldEmptyPos.row * 100}%)`;
            // Затем с небольшой задержкой перемещаем плитку в новую позицию
            setTimeout(() => {
                movingTile.style.transform = `translate(${col * 100}%, ${row * 100}%)`;
            }, 20);
        }

        // По окончании анимации (300 мс) перерисовываем доску и проверяем выигрыш
        setTimeout(() => {
            renderBoard();
            if (checkWin()) {
                messageElement.textContent = 'Поздравляем! Вы выиграли!';
            }
        }, 300);
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
