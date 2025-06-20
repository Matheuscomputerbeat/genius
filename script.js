// Genius Profissional - Áudio gerado via Web Audio API

const colors = ['green', 'red', 'yellow', 'blue'];
const colorFreq = { green: 329, red: 220, yellow: 440, blue: 554, wrong: 110 };
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

// Função para gerar áudio
function playSound(color, duration = 340) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = color === 'wrong' ? 'sawtooth' : 'sine';
    o.frequency.value = colorFreq[color] || 300;
    g.gain.value = color === 'wrong' ? 0.25 : 0.14;
    o.connect(g).connect(ctx.destination);
    o.start();
    if (color === 'wrong') {
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 900);
    }
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, duration);
  } catch (e) {}
}

function updateStatus() {
  levelDisplay.textContent = level;
  scoreDisplay.textContent = score;
  highScoreDisplay.textContent = highScore;
}

function setMessage(message, color = '#ffecb3') {
  msg.textContent = message;
  msg.style.color = color;
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
    playSound('wrong', 500);
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

// Teclas Q, W, A, S
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
