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
const devBtn = document.getElementById('dev-button');

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
    if (flat[i] !== i + 1) return false;
  }
  return flat[flat.length - 1] === 0;
}

function showVictory() {
  stopTimer();
  soundWin.play().catch(() => {});
  messageElement.textContent = `🎉 Победа, ${userName}!`;
  messageElement.style.opacity = '1';
  coins += 10;
  updateCoinsDisplay();
  launchConfetti();
  localStorage.removeItem("pyatnashki-save");
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
// 🎊 Конфетти по углам
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  const confetti = [];

  for (let i = 0; i < 150; i++) {
    confetti.push({
      x: Math.random() * W,
      y: Math.random() * H - H,
      r: Math.random() * 6 + 4,
      d: Math.random() * 100,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.floor(Math.random() * 10) - 10
    });
  }

  let angle = 0;
  const interval = setInterval(() => {
    ctx.clearRect(0, 0, W, H);
    angle += 0.01;
    confetti.forEach(c => {
      c.y += Math.cos(angle + c.d) + 1 + c.r / 2;
      c.x += Math.sin(angle) * 2;
      ctx.beginPath();
      ctx.fillStyle = c.color;
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }, 20);

  setTimeout(() => clearInterval(interval), 3000);
}

// 🎨 Магазин блоков
const availableSkins = {
  "default": "var(--tile-color)",
  "#ff6b6b": "#ff6b6b",
  "#4ecdc4": "#4ecdc4",
  "#ffe66d": "#ffe66d",
  "#1a535c": "#1a535c",
  "#c084fc": "#c084fc",
};

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
  createTiles();
  updateTilePositions();
  setTimeout(() => {
    showVictory();
  }, 300);
}

// 🔐 Чит-доступ
devBtn?.addEventListener('click', () => {
  const input = prompt('Введите пароль для доступа:');
  if (input === '727666') {
    if (!document.getElementById('auto-solve')) {
      const autoBtn = document.createElement('button');
      autoBtn.id = 'auto-solve';
      autoBtn.textContent = '🧠 Автопрохождение';
      document.body.appendChild(autoBtn);
      autoBtn.addEventListener('click', solve);
      showToast('🧠 Чит-режим активирован!');
    }
  } else {
    showToast('❌ Неверный пароль');
  }
});

// 📦 Подключение кнопок
themeToggle?.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  createTiles();
  updateTilePositions();
});

sizeSelector?.addEventListener('change', () => {
  size = parseInt(sizeSelector.value);
  localStorage.setItem("size", size);
  initGame();
});

shopBtn?.addEventListener('click', () => {
  shopModal.classList.remove('hidden');
});

closeShopBtn?.addEventListener('click', () => {
  shopModal.classList.add('hidden');
});

newGameBtn?.addEventListener('click', initGame);
undoBtn?.addEventListener('click', undoMove);
window.addEventListener('beforeunload', saveGame);
// ========== ЧИТ-МЕНЮ ==========

const cheatBtn = document.getElementById('dev-button');
const cheatModal = document.getElementById('cheat-password');
const cheatInput = document.getElementById('cheat-input');
const cheatEnter = document.getElementById('cheat-enter');
const cheatMenu = document.getElementById('cheat-menu');
const closeCheat = document.getElementById('close-cheat');

// 🤖 Показать поле ввода пароля
cheatBtn?.addEventListener('click', () => {
  cheatModal.classList.remove('hidden');
  cheatInput.value = '';
  cheatInput.focus();
});

// ✅ Ввод пароля
cheatEnter?.addEventListener('click', () => {
  if (cheatInput.value === '727666') {
    cheatModal.classList.add('hidden');
    cheatMenu.classList.remove('hidden');
    showToast('🧠 Чит-режим активирован!');
  } else {
    showToast('❌ Неверный пароль');
  }
});

// ❌ Закрыть меню
closeCheat?.addEventListener('click', () => {
  cheatMenu.classList.add('hidden');
});

// 🔘 Действия по кнопкам
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
      showToast('🎨 Скин применён бесплатно!');
    }
  });
});

// 🔀 Функция перемешивания без сброса
function shuffleBoard() {
  const flat = board.flat().filter(x => x !== 0);
  shuffle(flat);
  for (let i = 0; i < size * size - 1; i++) {
    board[Math.floor(i / size)][i % size] = flat[i];
  }
  board[size - 1][size - 1] = 0;
  emptyPos = { row: size - 1, col: size - 1 };
}
