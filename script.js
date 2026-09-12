const canvas = document.getElementById('flappyCanvas');
const ctx = canvas.getContext('2d');
const liveScore = document.getElementById('live-score');
const homeOverlay = document.getElementById('home-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const nameModal = document.getElementById('name-modal');
const dispUsername = document.getElementById('disp-username');
const homeBest = document.getElementById('home-best');
const finalScore = document.getElementById('final-score');
const finalHigh = document.getElementById('final-high');
const playerNameInput = document.getElementById('player-name-input');
const btnSaveName = document.getElementById('btn-save-name');
const btnOpenName = document.getElementById('btn-open-name');
const btnPlayAgain = document.getElementById('btn-play-again');
const tabScoreBtn = document.getElementById('tab-score-btn');
const tabDailyBtn = document.getElementById('tab-daily-btn');
const panelScore = document.getElementById('panel-score');
const panelDaily = document.getElementById('panel-daily');
const dailyList = document.getElementById('daily-list');

const jumpAudios = [document.getElementById('snd-jump-1'), document.getElementById('snd-jump-2')];
let jumpIndex = 0;
const hitAudios = [document.getElementById('snd-hit-1'), document.getElementById('snd-hit-2'), document.getElementById('snd-hit-3')];
let hitIndex = 0;
const scoreAudios = [document.getElementById('snd-score-1'), document.getElementById('snd-score-2'), document.getElementById('snd-score-3')];
let scoreIndex = 0;

function playSound(audio) { if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); } }
function fireJumpSound() { playSound(jumpAudios[jumpIndex]); jumpIndex = (jumpIndex + 1) % jumpAudios.length; }
function fireHitSound() { playSound(hitAudios[hitIndex]); hitIndex = (hitIndex + 1) % hitAudios.length; }
function fireScoreSound() { playSound(scoreAudios[scoreIndex]); scoreIndex = (scoreIndex + 1) % scoreAudios.length; }

let username = localStorage.getItem('sheikh_username') || 'Player123';
let highScore = parseInt(localStorage.getItem('sheikh_best_score') || '0');
let score = 0;
let frames = 0;
let gameState = 'HOME';

dispUsername.textContent = username;
homeBest.textContent = highScore;

const bird = {
  x: 65, y: 240, radius: 12, gravity: 0.28, velocity: 0, jumpLift: -5.1,
  draw() {
    ctx.save(); ctx.translate(this.x, this.y);
    let angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 5, (this.velocity * 4) * Math.PI / 180));
    ctx.rotate(angle);
    ctx.fillStyle = '#f8d038'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath();
    let wingY = Math.sin(frames * 0.3) * 4;
    ctx.ellipse(-4, wingY, 8, 5, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -4, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(8, -4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f05323'; ctx.beginPath(); ctx.moveTo(9, -2); ctx.lineTo(19, 2); ctx.lineTo(9, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  flap() { this.velocity = this.jumpLift; fireJumpSound(); },
  update() {
    this.velocity += this.gravity; this.y += this.velocity;
    if (this.y + this.radius >= canvas.height - 80) { this.y = canvas.height - 80 - this.radius; endGame(); }
    if (this.y - this.radius <= 0) { this.y = this.radius; this.velocity = 0; }
  },
  reset() { this.y = 240; this.velocity = 0; }
};

const pipes = {
  list: [], gap: 130, width: 55, speed: 2,
  draw() {
    for (let p of this.list) {
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#000';
      ctx.fillStyle = '#73bf2e'; ctx.fillRect(p.x, 0, this.width, p.top); ctx.strokeRect(p.x, 0, this.width, p.top);
      ctx.fillStyle = '#9ee344'; ctx.fillRect(p.x + 4, 0, 8, p.top);
      ctx.fillStyle = '#73bf2e'; ctx.fillRect(p.x - 3, p.top - 20, this.width + 6, 20); ctx.strokeRect(p.x - 3, p.top - 20, this.width + 6, 20);
      ctx.fillStyle = '#9ee344'; ctx.fillRect(p.x + 2, p.top - 20, 8, 20);
      let botY = p.top + this.gap; let botH = canvas.height - 80 - botY;
      ctx.fillStyle = '#73bf2e'; ctx.fillRect(p.x, botY, this.width, botH); ctx.strokeRect(p.x, botY, this.width, botH);
      ctx.fillStyle = '#9ee344'; ctx.fillRect(p.x + 4, botY, 8, botH);
      ctx.fillStyle = '#73bf2e'; ctx.fillRect(p.x - 3, botY, this.width + 6, 20); ctx.strokeRect(p.x - 3, botY, this.width + 6, 20);
      ctx.fillStyle = '#9ee344'; ctx.fillRect(p.x + 2, botY, 8, 20);
    }
  },
  update() {
    if (frames % 100 === 0) {
      let maxTop = canvas.height - 80 - this.gap - 60;
      let topH = Math.floor(Math.random() * (maxTop - 50)) + 50;
      this.list.push({ x: canvas.width, top: topH, cleared: false });
    }
    for (let i = 0; i < this.list.length; i++) {
      let p = this.list[i]; p.x -= this.speed;
      if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.width) {
        if (bird.y - bird.radius < p.top || bird.y + bird.radius > p.top + this.gap) { endGame(); return; }
      }
      if (p.x + this.width < bird.x && !p.cleared) { score++; p.cleared = true; liveScore.textContent = score; fireScoreSound(); }
      if (p.x + this.width < 0) { this.list.splice(i, 1); i--; }
    }
  },
  reset() { this.list = []; }
};

function drawCityEnvironment() {
  ctx.fillStyle = '#4ec0ca'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#a6dfd5';
  for (let i = 0; i < 5; i++) { ctx.fillRect(i * 85, canvas.height - 180, 55, 100); ctx.fillRect(i * 85 + 35, canvas.height - 215, 40, 135); }
  ctx.fillStyle = '#ded895'; ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
  ctx.fillStyle = '#73bf2e'; ctx.fillRect(0, canvas.height - 80, canvas.width, 15);
  ctx.fillStyle = '#558022'; ctx.fillRect(0, canvas.height - 65, canvas.width, 4);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, canvas.height - 80); ctx.lineTo(canvas.width, canvas.height - 80); ctx.stroke();
}

function renderLoop() {
  drawCityEnvironment();
  if (gameState === 'PLAYING') { pipes.update(); bird.update(); }
  pipes.draw(); bird.draw(); frames++; requestAnimationFrame(renderLoop);
}

function handleUserInput() {
  if (gameState === 'HOME') { gameState = 'PLAYING'; homeOverlay.classList.add('hidden'); liveScore.classList.remove('hidden'); bird.flap(); }
  else if (gameState === 'PLAYING') { bird.flap(); }
}

window.addEventListener('keydown', (e) => { if (e.code === 'Space' && gameState !== 'GAMEOVER') handleUserInput(); });
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameState !== 'GAMEOVER') handleUserInput(); }, { passive: false });
canvas.addEventListener('mousedown', (e) => { if (e.button === 0 && gameState !== 'GAMEOVER') handleUserInput(); });

function endGame() {
  gameState = 'GAMEOVER'; fireHitSound();
  if (score > highScore) { highScore = score; localStorage.setItem('sheikh_best_score', highScore); }
  finalScore.textContent = score; finalHigh.textContent = highScore; homeBest.textContent = highScore;
  liveScore.classList.add('hidden'); gameoverOverlay.classList.remove('hidden'); toggleTab('score');
}

btnPlayAgain.addEventListener('click', () => {
  gameoverOverlay.classList.add('hidden'); bird.reset(); pipes.reset(); score = 0; liveScore.textContent = '0';
  gameState = 'PLAYING'; liveScore.classList.remove('hidden'); bird.flap();
});

tabScoreBtn.addEventListener('click', () => toggleTab('score'));
tabDailyBtn.addEventListener('click', () => toggleTab('daily'));

function toggleTab(type) {
  if (type === 'score') {
    tabScoreBtn.classList.add('active'); tabDailyBtn.classList.remove('active');
    panelScore.classList.remove('hidden'); panelDaily.classList.add('hidden');
  } else {
    tabDailyBtn.classList.add('active'); tabScoreBtn.classList.remove('active');
    panelDaily.classList.remove('hidden'); panelScore.classList.add('hidden');
    dailyList.innerHTML = `1. SlickFloof - 1148<br>2. Jon_D - 776<br>3. ${username} - ${score}<br>4. Zaith - 473<br>5. dridonthebeat - 352`;
  }
}

btnOpenName.addEventListener('click', (e) => { e.stopPropagation(); playerNameInput.value = username; nameModal.classList.remove('hidden'); });
btnSaveName.addEventListener('click', (e) => {
  e.stopPropagation(); let val = playerNameInput.value.trim();
  if (val) { username = val; localStorage.setItem('sheikh_username', username); dispUsername.textContent = username; }
  nameModal.classList.add('hidden');
});

renderLoop();
