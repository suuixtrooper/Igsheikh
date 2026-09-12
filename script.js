const canvas = document.getElementById('flappyCanvas');
const ctx = canvas.getContext('2d');

const liveScore = document.getElementById('live-score');
const menuOverlay = document.getElementById('menu-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const btnEnter = document.getElementById('btn-enter');
const btnReplay = document.getElementById('btn-replay');
const scoreVal = document.getElementById('score-val');
const bestVal = document.getElementById('best-val');

// സൗണ്ടുകൾ
const jumpSounds = [
  document.getElementById('audio-jump-1'),
  document.getElementById('audio-jump-2')
];
let jumpIndex = 0;
let jumpToggle = true;

const scoreSounds = [
  document.getElementById('audio-score-1'),
  document.getElementById('audio-score-2'),
  document.getElementById('audio-score-3')
];
let scoreIndex = 0;

const hitSounds = [
  document.getElementById('audio-hit-1'),
  document.getElementById('audio-hit-2'),
  document.getElementById('audio-hit-3')
];
let hitIndex = 0;

function playAudio(audio) {
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

function handleJumpSound() {
  if (jumpToggle) {
    playAudio(jumpSounds[jumpIndex]);
    jumpIndex = (jumpIndex + 1) % jumpSounds.length;
  }
  jumpToggle = !jumpToggle;
}

function playScoreSound() {
  playAudio(scoreSounds[scoreIndex]);
  scoreIndex = (scoreIndex + 1) % scoreSounds.length;
}

function playHitSound() {
  playAudio(hitSounds[hitIndex]);
  hitIndex = (hitIndex + 1) % hitSounds.length;
}

// ഗെയിം സ്റ്റേറ്റ്
let isRunning = false;
let frames = 0;
let score = 0;
let highScore = localStorage.getItem('sheikh_high_score') || 0;

// ചിറകടിക്കുന്ന പക്ഷി (Animated Bird)
const bird = {
  x: 65,
  y: 220,
  radius: 12,
  gravity: 0.28,
  velocity: 0,
  jumpStrength: -5.0,
  wingState: 0, // ചിറകിന്റെ മൂവ്‌മെന്റ്

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    let angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 5, (this.velocity * 5) * Math.PI / 180));
    ctx.rotate(angle);

    // ശരീരം (Yellow)
    ctx.fillStyle = '#f8d038';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ചിറക് ആനിമേഷൻ (Flapping Wings)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    let wingY = Math.sin(frames * 0.25) * 4;
    ctx.ellipse(-4, wingY, 8, 5, -0.2, 0, Math.PI * 2);
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
    ctx.moveTo(9, -1);
    ctx.lineTo(19, 3);
    ctx.lineTo(9, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  },

  flap() {
    this.velocity = this.jumpStrength;
    handleJumpSound();
  },

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    // ഗ്രൗണ്ട് കൊളീഷൻ
    if (this.y + this.radius >= canvas.height - 80) {
      this.y = canvas.height - 80 - this.radius;
      triggerGameOver();
    }
    // സീലിംഗ് ലിമിറ്റ്
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.velocity = 0;
    }
  },

  reset() {
    this.y = 220;
    this.velocity = 0;
  }
};

// പൈപ്പുകൾ (Original Green Pipes with Shading)
const pipes = {
  items: [],
  gap: 125,
  width: 55,
  speed: 2,

  draw() {
    for (let p of this.items) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000';

      // Pipe Body
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(p.x, 0, this.width, p.top);
      ctx.strokeRect(p.x, 0, this.width, p.top);

      // Top Shading Line
      ctx.fillStyle = '#9ee344';
      ctx.fillRect(p.x + 5, 0, 8, p.top);

      // Top Rim
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(p.x - 3, p.top - 20, this.width + 6, 20);
      ctx.strokeRect(p.x - 3, p.top - 20, this.width + 6, 20);
      ctx.fillStyle = '#9ee344';
      ctx.fillRect(p.x + 2, p.top - 20, 8, 20);

      // Bottom Pipe
      let bY = p.top + this.gap;
      let bH = canvas.height - 80 - bY;
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(p.x, bY, this.width, bH);
      ctx.strokeRect(p.x, bY, this.width, bH);

      // Bottom Shading Line
      ctx.fillStyle = '#9ee344';
      ctx.fillRect(p.x + 5, bY, 8, bH);

      // Bottom Rim
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(p.x - 3, bY, this.width + 6, 20);
      ctx.strokeRect(p.x - 3, bY, this.width + 6, 20);
      ctx.fillStyle = '#9ee344';
      ctx.fillRect(p.x + 2, bY, 8, 20);
    }
  },

  update() {
    if (frames % 95 === 0) {
      let maxTop = canvas.height - 80 - this.gap - 60;
      let t = Math.floor(Math.random() * (maxTop - 50)) + 50;
      this.items.push({ x: canvas.width, top: t, scored: false });
    }

    for (let i = 0; i < this.items.length; i++) {
      let p = this.items[i];
      p.x -= this.speed;

      // തട്ടിയോ എന്ന് നോക്കുന്നു
      if (
        bird.x + bird.radius > p.x &&
        bird.x - bird.radius < p.x + this.width
      ) {
        if (bird.y - bird.radius < p.top || bird.y + bird.radius > p.top + this.gap) {
          triggerGameOver();
          return;
        }
      }

      // സ്കോർ നൽകുന്നു
      if (p.x + this.width < bird.x && !p.scored) {
        score++;
        p.scored = true;
        liveScore.textContent = score;
        playScoreSound();
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

// നിങ്ങൾ വീഡിയോയിൽ കാണിച്ച പോലെയുള്ള സിറ്റി ബാക്ക്‌ഗ്രൗണ്ടും തറയും
function drawEnvironment() {
  // ആകാശം
  ctx.fillStyle = '#70c5ce';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // റിട്രോ സിറ്റി ബിൽഡിംഗുകൾ
  ctx.fillStyle = '#a6dfd5';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(i * 80, canvas.height - 180, 50, 100);
    ctx.fillRect(i * 80 + 35, canvas.height - 210, 35, 130);
  }

  // തറ (Ground with original texture pattern)
  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

  // പുല്ല് ബോർഡർ
  ctx.fillStyle = '#73bf2e';
  ctx.fillRect(0, canvas.height - 80, canvas.width, 15);
  ctx.fillStyle = '#558022';
  ctx.fillRect(0, canvas.height - 65, canvas.width, 4);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 80);
  ctx.lineTo(canvas.width, canvas.height - 80);
  ctx.stroke();
}

// 60FPS Game Loop
function gameLoop() {
  drawEnvironment();

  if (isRunning) {
    pipes.update();
    bird.update();
  }

  pipes.draw();
  bird.draw();

  frames++;
  requestAnimationFrame(gameLoop);
}

// ടച്ച് & കീബോർഡ് കൺട്രോളുകൾ
function handleInteraction(e) {
  if (e) e.preventDefault();
  if (isRunning) {
    bird.flap();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') handleInteraction(e);
});

canvas.addEventListener('touchstart', handleInteraction, { passive: false });
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) handleInteraction(e);
});

// ബട്ടൺ ഇവന്റുകൾ
btnEnter.addEventListener('click', (e) => {
  e.stopPropagation();
  menuOverlay.classList.add('hidden');
  startGame();
});

btnReplay.addEventListener('click', (e) => {
  e.stopPropagation();
  gameoverOverlay.classList.add('hidden');
  startGame();
});

function triggerGameOver() {
  isRunning = false;
  playHitSound();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('sheikh_high_score', highScore);
  }

  scoreVal.textContent = score;
  bestVal.textContent = highScore;
  gameoverOverlay.classList.remove('hidden');
}

function startGame() {
  bird.reset();
  pipes.reset();
  score = 0;
  frames = 0;
  jumpIndex = 0;
  jumpToggle = true;
  liveScore.textContent = score;
  isRunning = true;
}

// ഗെയിം സ്റ്റാർട്ട്
gameLoop();
