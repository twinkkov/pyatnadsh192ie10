document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.body.classList.add('loaded');
    applySavedTheme();
    loadSkin();
    restoreGame() || initGame();
  }, 1000);
});

const tg = window.Telegram?.WebApp;
let userName = 'игрок';

if (tg) {
  tg.ready();
  tg.expand();
  const name = tg.initDataUnsafe?.user?.first_name;
  if (name) {
    userName = name;
    const greeting = document.getElementById("greeting");
    if (greeting) greeting.textContent = `Привет, ${userName}!`;
  }
}

const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const timerElement = document.getElementById('timer');
const messageElement = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');
const undoBtn = document.getElementById('undo');
const coinsElement = document.getElementById('coins');
const sizeSelector = document.getElementById('size-selector');
const themeToggle = document.getElementById('toggle-theme');
const shopBtn = document.getElementById('open-shop');
const shopModal = document.getElementById('shop-modal');
const skinGrid = document.getElementById('skin-options');
const closeShopBtn = document.getElementById('close-shop');
const victoryMessage = document.getElementById('victoryMessage');

let board = [];
let emptyPos = { row: 3, col: 3 };
let moves = 0;
let timer = 0;
let timerInterval;
let isAnimating = false;
let tileElements = {};
let history = [];
let size = +localStorage.getItem("size") || 4;
let coins = +localStorage.getItem("coins") || 0;
let selectedSkin = localStorage.getItem("skin") || "default";

const soundWin = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_2d24f4a726.mp3");

function updateCoinsDisplay() {
  coinsElement.textContent = coins;
  localStorage.setItem("coins", coins);
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    const mins = String(Math.floor(timer / 60)).padStart(2, '0');
    const secs = String(timer % 60).padStart(2, '0');
    timerElement.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function saveGame() {
  const save = { board, emptyPos, moves, timer, size, selectedSkin };
  localStorage.setItem("pyatnashki-save", JSON.stringify(save));
}

function restoreGame() {
  const saved = localStorage.getItem("pyatnashki-save");
  if (!saved) return false;
  try {
    const data = JSON.parse(saved);
    size = data.size || 4;
    selectedSkin = data.selectedSkin || "default";
    sizeSelector.value = size;
    board = data.board;
    emptyPos = data.emptyPos;
    moves = data.moves;
    timer = data.timer;
    history = [];
    movesElement.textContent = moves;
    messageElement.textContent = '';
    messageElement.style.opacity = '0';
    startTimer();
    createTiles();
    updateTilePositions();
    updateCoinsDisplay();
    return true;
  } catch {
    return false;
  }
}

function applySavedTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

themeToggle?.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  createTiles();
  updateTilePositions();
});
function initGame() {
  const total = size * size - 1;
  const numbers = Array.from({ length: total }, (_, i) => i + 1);
  do shuffle(numbers); while (!isSolvable(numbers));

  board = [];
  for (let i = 0; i < size; i++) board.push(numbers.slice(i * size, i * size + size));
  board[size - 1][size - 1] = 0;
  emptyPos = { row: size - 1, col: size - 1 };
  moves = 0;
  history = [];
  movesElement.textContent = moves;
  messageElement.textContent = '';
  messageElement.style.opacity = '0';
  timer = 0;
  startTimer();
  createTiles();
  updateTilePositions();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function isSolvable(numbers) {
  let inv = 0;
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] > numbers[j]) inv++;
    }
  }
  return inv % 2 === 0;
}

function createTiles() {
  boardElement.innerHTML = '';
  tileElements = {};
  const tileSize = 100 / size + '%';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const value = board[i][j];
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.width = tileSize;
      tile.style.height = tileSize;

      tile.style.background = selectedSkin === 'default' ? 'var(--tile-color)' : selectedSkin;
      if (value === 0) {
        tile.classList.add('empty');
        continue;
      }
      tile.textContent = value;
      boardElement.appendChild(tile);
      tileElements[value] = tile;
      requestAnimationFrame(() => tile.classList.add('show'));
    }
  }
}

function updateTilePositions() {
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const value = board[i][j];
      if (value === 0) continue;
      const tile = tileElements[value];
      if (!tile) continue;
      tile.style.transform = `translate(${j * 100}%, ${i * 100}%)`;
      tile.onclick = () => handleTileClick(i, j);

      let startX, startY;
      tile.ontouchstart = (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
      };
      tile.ontouchend = (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 30 && canMove(i, j + 1)) handleTileClick(i, j);
          else if (dx < -30 && canMove(i, j - 1)) handleTileClick(i, j);
        } else {
          if (dy > 30 && canMove(i + 1, j)) handleTileClick(i, j);
          else if (dy < -30 && canMove(i - 1, j)) handleTileClick(i, j);
        }
      };
    }
  }
}

function canMove(row, col) {
  return row === emptyPos.row && col === emptyPos.col;
}

function handleTileClick(row, col) {
  if (isAnimating) return;
  const dr = Math.abs(row - emptyPos.row);
  const dc = Math.abs(col - emptyPos.col);
  if (dr + dc !== 1) return;

  const value = board[row][col];
  history.push({ board: board.map(r => [...r]), emptyPos: { ...emptyPos } });
  board[emptyPos.row][emptyPos.col] = value;
  board[row][col] = 0;
  emptyPos = { row, col };
  moves++;
  movesElement.textContent = moves;
  isAnimating = true;
  updateTilePositions();
  setTimeout(() => {
    isAnimating = false;
    if (checkWin()) showVictory();
  }, 300);
}

function checkWin() {
  const flat = board.flat();
  for (let i = 0; i < flat.length - 1; i++) {
    if (flat[i] !== i + 1) {
      messageElement.textContent = 'Порядок не соблюден!';
      messageElement.style.opacity = '1';
      return false;
    }
  }
  if (flat[flat.length - 1] !== 0) {
    messageElement.textContent = 'Последний элемент не пустой!';
    messageElement.style.opacity = '1';
    return false;
  }
  messageElement.textContent = 'Вы выиграли!';
  messageElement.style.opacity = '1';
  return true;
}

function showVictory() {
  victoryMessage.classList.remove('hidden');
  stopTimer();
  showConfetti();

  setTimeout(() => {
    stopConfetti(); // конфетти убирается через 3 секунды
  }, 3000);
}

function showConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.style.display = 'block';
  confetti.start(canvas);
}

function stopConfetti() {
  confetti.stop();
  const canvas = document.getElementById('confetti-canvas');
  canvas.style.display = 'none';
}

function undoMove() {
  if (!history.length || isAnimating) return;
  const last = history.pop();
  board = last.board.map(row => [...row]);
  emptyPos = { ...last.emptyPos };
  moves--;
  movesElement.textContent = moves;
  updateTilePositions();
}

function solve() {
  board = [];
  let count = 1;
  for (let i = 0; i < size; i++) {
    board[i] = [];
    for (let j = 0; j < size; j++) {
      board[i][j] = count++;
    }
  }
  board[size - 1][size - 1] = 0;
  emptyPos = { row: size - 1, col: size - 1 };
  history = [];
  moves = 0;
  timer = 0;
  movesElement.textContent = '0';
  timerElement.textContent = '00:00';
  createTiles();
  updateTilePositions();
  setTimeout(() => {
    showVictory();
  }, 300);
}

function autoSolve() {
  setTimeout(() => {
    document.querySelector('.board').style.margin = '0 auto';
  }, 100);
}

// Магазин скинов
const availableSkins = {
  "default": "var(--tile-color)",
  "#ff6b6b": "#ff6b6b",
  "#4ecdc4": "#4ecdc4",
  "#ffe66d": "#ffe66d",
  "#1a535c": "#1a535c",
  "#c084fc": "#c084fc",
};

function loadSkin() {
  if (!skinGrid) return;
  skinGrid.innerHTML = '';

  Object.entries(availableSkins).forEach(([key, color]) => {
    const div = document.createElement('div');
    div.className = 'skin-option';
    div.style.background = color;
    if (key === selectedSkin) div.classList.add('selected');
    div.onclick = () => {
      if (coins < 20 && key !== 'default') {
        showToast('Недостаточно монет для покупки 😢');
        return;
      }
      selectedSkin = key;
      localStorage.setItem("skin", selectedSkin);
      createTiles();
      updateTilePositions();
      document.querySelectorAll('.skin-option').forEach(e => e.classList.remove('selected'));
      div.classList.add('selected');
      if (key !== 'default') {
        coins -= 20;
        updateCoinsDisplay();
      }
    };
    skinGrid.appendChild(div);
  });
}

// Toast
function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.add('show');
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, 2000);
}

// Обработчики
newGameBtn?.addEventListener('click', initGame);
undoBtn?.addEventListener('click', undoMove);
shopBtn?.addEventListener('click', () => shopModal.classList.remove('hidden'));
closeShopBtn?.addEventListener('click', () => shopModal.classList.add('hidden'));
sizeSelector?.addEventListener('change', () => {
  size = parseInt(sizeSelector.value);
  localStorage.setItem("size", size);
  initGame();
});
window.addEventListener('beforeunload', saveGame);

// === ЧИТ-МЕНЮ ===
const devBtn = document.getElementById('dev-button');
const cheatModal = document.getElementById('cheat-password');
const cheatInput = document.getElementById('cheat-input');
const cheatEnter = document.getElementById('cheat-enter');
const cheatCancel = document.getElementById('cheat-cancel');
const cheatMenu = document.getElementById('cheat-menu');
const closeCheat = document.getElementById('close-cheat');

devBtn?.addEventListener('click', () => {
  cheatModal.classList.remove('hidden');
  cheatInput.value = '';
  cheatInput.focus();
});

cheatEnter?.addEventListener('click', () => {
  if (cheatInput.value === '727666') {
    cheatModal.classList.add('hidden');
    cheatMenu.classList.remove('hidden');
    showToast('🧠 Чит-режим активирован!');
  } else {
    showToast('❌ Неверный пароль');
  }
});

cheatCancel?.addEventListener('click', () => {
  cheatModal.classList.add('hidden');
});

closeCheat?.addEventListener('click', () => {
  cheatMenu.classList.add('hidden');
});

document.getElementById("closePasswordModal")?.addEventListener("click", () => {
  document.getElementById("passwordModal").style.display = "none";
});

document.querySelectorAll('.cheat-btn[data-action]').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'solve') solve();
    if (action === 'coins') {
      coins += 100;
      updateCoinsDisplay();
      showToast('+100 монет 🤑');
    }
    if (action === 'shuffle') {
      shuffleBoard();
      updateTilePositions();
      showToast('🔀 Перемешано');
    }
    if (action === 'dark') {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      createTiles(); updateTilePositions();
    }
    if (action === 'light') {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      createTiles(); updateTilePositions();
    }
    if (action === 'field5') {
      size = 5;
      sizeSelector.value = '5';
      localStorage.setItem("size", size);
      initGame();
      showToast('📏 Поле 5x5');
    }
    if (action === 'skin') {
      selectedSkin = '#ff6b6b';
      localStorage.setItem("skin", selectedSkin);
      createTiles();
      updateTilePositions();
      showToast('🎨 Скин применён!');
    }
  });
});

function shuffleBoard() {
  const flat = board.flat().filter(x => x !== 0);
  shuffle(flat);
  for (let i = 0; i < size * size - 1; i++) {
    board[Math.floor(i / size)][i % size] = flat[i];
  }
  board[size - 1][size - 1] = 0;
  emptyPos = { row: size - 1, col: size - 1 };
}
