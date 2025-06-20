// Genius Profissional - Matheuscomputerbeat

const colors = ['green', 'red', 'yellow', 'blue'];
const colorSounds = {
  green: document.getElementById('sound-green'),
  red: document.getElementById('sound-red'),
  yellow: document.getElementById('sound-yellow'),
  blue: document.getElementById('sound-blue'),
  wrong: document.getElementById('sound-wrong')
};

let sequence = [];
let userSequence = [];
let level = 0;
let score = 0;
let highScore = localStorage.getItem('geniusHighScore') || 0;
let playing = false;
let canClick = false;

const board = document.getElementById('genius-board');
const startBtn = document.getElementById('start-btn');
const levelDisplay = document.getElementById('level');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const msg = document.getElementById('msg');

function updateStatus() {
  levelDisplay.textContent = level;
  scoreDisplay.textContent = score;
  highScoreDisplay.textContent = highScore;
}

function setMessage(message, color = '#ffecb3') {
  msg.textContent = message;
  msg.style.color = color;
}

function playSound(color) {
  if (colorSounds[color]) {
    colorSounds[color].currentTime = 0;
    colorSounds[color].play();
  }
}

function animateBtn(color) {
  const btn = document.querySelector(`.color-btn.${color}`);
  btn.classList.add('active');
  playSound(color);
  setTimeout(() => {
    btn.classList.remove('active');
  }, 350);
}

function nextStep() {
  userSequence = [];
  level++;
  score += 10 * level;
  updateStatus();
  setMessage('Observe e memorize a sequência...');
  sequence.push(colors[Math.floor(Math.random() * 4)]);
  playSequence();
}

function playSequence() {
  let i = 0;
  canClick = false;
  function next() {
    if (i < sequence.length) {
      animateBtn(sequence[i]);
      setTimeout(next, 600);
      i++;
    } else {
      canClick = true;
      setMessage('Sua vez! Repita a sequência.');
    }
  }
  setTimeout(next, 900);
}

function handleColorClick(e) {
  if (!playing || !canClick) return;
  const color = e.target.dataset.color;
  if (!color) return;
  userSequence.push(color);
  animateBtn(color);

  // Checagem
  if (color !== sequence[userSequence.length - 1]) {
    playSound('wrong');
    setMessage('Errou! Fim de Jogo.', '#f66');
    playing = false;
    canClick = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('geniusHighScore', highScore);
      setTimeout(() => setMessage('Novo recorde! 🎉', '#f1c40f'), 1200);
    }
    startBtn.disabled = false;
    startBtn.textContent = 'Jogar Novamente';
    return;
  }

  if (userSequence.length === sequence.length) {
    canClick = false;
    setMessage('Correto! Próximo nível...');
    setTimeout(nextStep, 1200);
  }
}

function startGame() {
  sequence = [];
  userSequence = [];
  level = 0;
  score = 0;
  playing = true;
  canClick = false;
  updateStatus();
  setMessage('Prepare-se...');
  startBtn.disabled = true;
  setTimeout(nextStep, 1200);
}

board.addEventListener('click', handleColorClick);
startBtn.addEventListener('click', startGame);

// Toque também no teclado!
document.addEventListener('keydown', e => {
  if (!playing || !canClick) return;
  const keyMap = { q: 'green', w: 'red', a: 'yellow', s: 'blue' };
  const color = keyMap[e.key.toLowerCase()];
  if (color) {
    document.querySelector(`.color-btn.${color}`).click();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  updateStatus();
  setMessage('Clique em "Iniciar Jogo" para começar!');
});