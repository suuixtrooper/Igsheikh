const canvas = document.getElementById('flappyCanvas');
const ctx = canvas.getContext('2d');

const liveScore = document.getElementById('live-score');
const homeOverlay = document.getElementById('home-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const nameModal = document.getElementById('name-modal');

const displayName = document.getElementById('display-name');
const topHighNum = document.getElementById('top-high-num');
const finalScore = document.getElementById('final-score');
const finalBest = document.getElementById('final-best');

const inputUsername = document.getElementById('input-username');
const btnSaveName = document.getElementById('btn-save-name');
const btnEditName = document.getElementById('btn-edit-name');
const btnReplay = document.getElementById('btn-replay');

const tabScore = document.getElementById('tab-score');
const tabDaily = document.getElementById('tab-daily');
const tabAlltime = document.getElementById('tab-alltime');
const scoreView = document.getElementById('score-view');
const rankView = document.getElementById('rank-view');
const rankContent = document.getElementById('rank-content');

// ഓഡിയോ ഫയലുകൾ
const jumpAudios = [document.getElementById('jump-1'), document.getElementById('jump-2')];
let jumpIdx = 0;

const hitAudios = [document.getElementById('hit-1'), document.getElementById('hit-2'), document.getElementById('hit-3')];
let hitIdx = 0;

const scoreAudios = [document.getElementById('score-1'), document.getElementById('score-2'), document.getElementById('score-3')];
let scoreIdx = 0;

function playAudio(audio) {
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

function nextJumpSound() {
  playAudio(jumpAudios[jumpIdx]);
  jumpIdx = (jumpIdx + 1) % jumpAudios.length;
}

function nextHitSound() {
  playAudio(hitAudios[hitIdx]);
  hitIdx = (hitIdx + 1) % hitAudios.length;
}

function nextScoreSound() {
  playAudio(scoreAudios[scoreIdx]);
  scoreIdx = (scoreIdx + 1) % scoreAudios.length;
}

// ഡാറ്റ വേരിയബിളുകൾ
let currentUser = localStorage.getItem('sheikh_user') || 'Player123';
let highScore = parseInt(localStorage.getItem('sheikh_high_score') || '0');
let score = 0;
let frames = 0;
let state = 'HOME'; // HOME, PLAY, GAMEOVER

displayName.textContent = currentUser;
topHighNum.textContent = highScore;

// ബേർഡ് ഒബ്‌ജക്റ്റ് (Wings Flap & Physics)
const bird = {
  x: 70,
  y: 260,
  radius: 12,
  gravity: 0.28,
  velocity: 0,
  jumpPower: -5.2,

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    let angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 5, (this.velocity * 4) * Math.PI / 180));
    ctx.rotate(angle);

    // ബോഡി
    ctx.fillStyle = '#f8d038';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ചിറക് മൂവ്‌മെന്റ് (Wing Flapping)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    let wingOffset = Math.sin(frames * 0.3) * 4;
    ctx.ellipse(-4, wingOffset, 8, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // കണ്ണ്
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(8, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // കൊക്ക്
    ctx.fillStyle = '#f05323';
    ctx.beginPath();
    ctx.moveTo(9, -2);
    ctx.lineTo(19, 2);
    ctx.lineTo(9, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  },

  flap() {
    this.velocity = this.jumpPower;
    nextJumpSound();
  },

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    if (this.y + this.radius >= canvas.height - 80) {
      this.y = canvas.height - 80 - this.radius;
      gameOver();
    }
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.velocity = 0;
    }
  },

  reset() {
    this.y = 260;
    this.velocity = 0;
  }
};

// പൈപ്പുകൾ
const pipes = {
  items: [],
  gap: 130,
  width: 55,
  speed: 2,

  draw() {
    for (let p of this.items) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000';

      // ടോപ്പ് പൈപ്പ്
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(p.x, 0, this.width, p.top);
      ctx.strokeRect(p.x, 0, this.width, p.top);
      ctx.fillStyle = '#9ee344';
      ctx.fillRect(p.x + 4, 0, 8, p.top);

      // ടോപ്പ് ക്യാപ്
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(p.x - 3, p.top - 20, this.width + 6, 20);
      ctx.strokeRect(p.x - 3, p.top - 20, this.width + 6, 20);
      ctx.fillStyle = '#9ee344';
      ctx.fillRect(p.x + 2, p.top - 20, 8, 20);

      // ബോട്ടം പൈപ്പ്
      let botY = p.top + this.gap;
      let botH = canvas.height - 80 - botY;
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(p.x, botY, this.width, botH);
      ctx.strokeRect(p.x, botY, this.width, botH);
      ctx.fillStyle = '#9ee344';
      ctx.fillRect(p.x + 4, botY, 8, botH);

      // ബോട്ടം ക്യാപ്
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(p.x - 3, botY, this.width + 6, 20);
      ctx.strokeRect(p.x - 3, botY, this.width + 6, 20);
      ctx.fillStyle = '#9ee344';
      ctx.fillRect(p.x + 2, botY, 8, 20);
    }
  },

  update() {
    if (frames % 100 === 0) {
      let maxTop = canvas.height - 80 - this.gap - 60;
      let topH = Math.floor(Math.random() * (maxTop - 50)) + 50;
      this.items.push({ x: canvas.width, top: topH, passed: false });
    }

    for (let i = 0; i < this.items.length; i++) {
      let p = this.items[i];
      p.x -= this.speed;

      // കൊളീഷൻ
      if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.width) {
        if (bird.y - bird.radius < p.top || bird.y + bird.radius > p.top + this.gap) {
          gameOver();
          return;
        }
      }

      // സ്കോർ
      if (p.x + this.width < bird.x && !p.passed) {
        score++;
        p.passed = true;
        liveScore.textContent = score;
        nextScoreSound();
      }

      if (p.x + this.width < 0) {
        this.items.splice(i, 1);
        i--;
      }
    }
  },

  reset() {
    this.items = [];
  }
};

// ബാക്ക്‌ഗ്രൗണ്ടും സിറ്റിയും
function drawBackground() {
  ctx.fillStyle = '#4ec0ca';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ബിൽഡിംഗുകൾ
  ctx.fillStyle = '#a6dfd5';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(i * 85, canvas.height - 180, 55, 100);
    ctx.fillRect(i * 85 + 35, canvas.height - 215, 40, 135);
  }

  // തറ
  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
  ctx.fillStyle = '#73bf2e';
  ctx.fillRect(0, canvas.height - 80, canvas.width, 15);
  ctx.fillStyle = '#558022';
  ctx.fillRect(0, canvas.height - 65, canvas.width, 4);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 80);
  ctx.lineTo(canvas.width, canvas.height - 80);
  ctx.stroke();
}

// മെയിൻ ലൂപ്പ് (60 FPS - Zero Lag)
function loop() {
  drawBackground();

  if (state === 'PLAY') {
    pipes.update();
    bird.update();
  }

  pipes.draw();
  bird.draw();

  frames++;
  requestAnimationFrame(loop);
}

// ടച്ച് / ക്ലിക്ക് കൺട്രോൾ
function handleAction() {
  if (state === 'HOME') {
    state = 'PLAY';
    homeOverlay.classList.add('hidden');
    liveScore.classList.remove('hidden');
    bird.flap();
  } else if (state === 'PLAY') {
    bird.flap();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && state !== 'GAMEOVER') handleAction();
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (state !== 'GAMEOVER') handleAction();
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0 && state !== 'GAMEOVER') handleAction();
});

// ഗെയിം ഓവർ
function gameOver() {
  state = 'GAMEOVER';
  nextHitSound();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('sheikh_high_score', highScore);
  }

  finalScore.textContent = score;
  finalBest.textContent = highScore;
  topHighNum.textContent = highScore;

  liveScore.classList.add('hidden');
  gameoverOverlay.classList.remove('hidden');
  switchTab('score');
}

// റീപ്ലേ
btnReplay.addEventListener('click', () => {
  gameoverOverlay.classList.add('hidden');
  bird.reset();
  pipes.reset();
  score = 0;
  liveScore.textContent = '0';
  state = 'PLAY';
  liveScore.classList.remove('hidden');
  bird.flap();
});

// ലീഡർബോർഡ് ടാബുകൾ
tabScore.addEventListener('click', () => switchTab('score'));
tabDaily.addEventListener('click', () => switchTab('daily'));
tabAlltime.addEventListener('click', () => switchTab('alltime'));

function switchTab(type) {
  tabScore.classList.remove('active');
  tabDaily.classList.remove('active');
  tabAlltime.classList.remove('active');

  if (type === 'score') {
    tabScore.classList.add('active');
    scoreView.classList.remove('hidden');
    rankView.classList.add('hidden');
  } else {
    scoreView.classList.add('hidden');
    rankView.classList.remove('hidden');
    if (type === 'daily') {
      tabDaily.classList.add('active');
      rankContent.innerHTML = `
        1. Jon_D - 486<br>
        2. ${currentUser} - ${score}<br>
        3. Zaith - 350
      `;
    } else {
      tabAlltime.classList.add('active');
      rankContent.innerHTML = `
        1. SlickFly - 1148<br>
        2. Jon_D - 776<br>
        3. ${currentUser} - ${highScore}
      `;
    }
  }
}

// പേര് എഡിറ്റ് ചെയ്യൽ
btnEditName.addEventListener('click', () => {
  inputUsername.value = currentUser;
  nameModal.classList.remove('hidden');
});

btnSaveName.addEventListener('click', () => {
  let val = inputUsername.value.trim();
  if (val) {
    currentUser = val;
    localStorage.setItem('sheikh_user', currentUser);
    displayName.textContent = currentUser;
  }
  nameModal.classList.add('hidden');
});

// ആരംഭം
loop();
