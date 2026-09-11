const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score-display');
const startMenu = document.getElementById('start-menu');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreVal = document.getElementById('final-score-val');

// Audio Objects with fallback error handling
const soundJump = document.getElementById('sound-jump');
const soundScore = document.getElementById('sound-score');
const soundHit = document.getElementById('sound-hit');

function playAudio(audio) {
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

// Game State
let isPlaying = false;
let frames = 0;
let score = 0;

// Bird
const bird = {
  x: 50,
  y: 200,
  w: 26,
  h: 20,
  radius: 12,
  gravity: 0.25,
  velocity: 0,
  jumpStrength: -4.8,

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Rotation based on movement
    let angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 4) * Math.PI / 180));
    ctx.rotate(angle);

    // Flappy Body (Yellow)
    ctx.fillStyle = '#f7dc6f';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(4, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(6, -4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(8, -1);
    ctx.lineTo(16, 2);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  },

  flap() {
    this.velocity = this.jumpStrength;
    playAudio(soundJump);
  },

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    // Ground collision
    if (this.y + this.radius >= canvas.height - 70) {
      this.y = canvas.height - 70 - this.radius;
      gameOver();
    }
    // Ceiling collision
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.velocity = 0;
    }
  },

  reset() {
    this.y = 200;
    this.velocity = 0;
  }
};

// Pipes (തൂണുകൾ)
const pipes = {
  items: [],
  gap: 110,
  width: 52,
  dx: 1.8,

  draw() {
    for (let p of this.items) {
      ctx.fillStyle = '#73bf2e';
      ctx.strokeStyle = '#543847';
      ctx.lineWidth = 2;

      // Top pipe
      ctx.fillRect(p.x, 0, this.width, p.top);
      ctx.strokeRect(p.x, 0, this.width, p.top);
      // Top Pipe Cap
      ctx.fillRect(p.x - 2, p.top - 18, this.width + 4, 18);
      ctx.strokeRect(p.x - 2, p.top - 18, this.width + 4, 18);

      // Bottom pipe
      let bottomY = p.top + this.gap;
      let bottomH = canvas.height - 70 - bottomY;
      ctx.fillRect(p.x, bottomY, this.width, bottomH);
      ctx.strokeRect(p.x, bottomY, this.width, bottomH);
      // Bottom Pipe Cap
      ctx.fillRect(p.x - 2, bottomY, this.width + 4, 18);
      ctx.strokeRect(p.x - 2, bottomY, this.width + 4, 18);
    }
  },

  update() {
    if (frames % 100 === 0) {
      let topHeight = Math.floor(Math.random() * (canvas.height - 70 - this.gap - 80)) + 40;
      this.items.push({
        x: canvas.width,
        top: topHeight,
        passed: false
      });
    }

    for (let i = 0; i < this.items.length; i++) {
      let p = this.items[i];
      p.x -= this.dx;

      // Collision Detection
      if (
        bird.x + bird.radius > p.x &&
        bird.x - bird.radius < p.x + this.width
      ) {
        if (bird.y - bird.radius < p.top || bird.y + bird.radius > p.top + this.gap) {
          gameOver();
          return;
        }
      }

      // Score Increment & Sound
      if (p.x + this.width < bird.x && !p.passed) {
        score++;
        p.passed = true;
        scoreDisplay.textContent = score;
        playAudio(soundScore);
      }

      // Remove off-screen pipes
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

// Ground & Background
function drawBackground() {
  // Sky
  ctx.fillStyle = '#70c5ce';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

  // Grass top border
  ctx.fillStyle = '#73bf2e';
  ctx.fillRect(0, canvas.height - 70, canvas.width, 12);
  ctx.strokeStyle = '#543847';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, canvas.height - 70, canvas.width, 12);
}

// Main Game Loop
function loop() {
  drawBackground();

  if (isPlaying) {
    pipes.update();
    bird.update();
  }

  pipes.draw();
  bird.draw();

  frames++;
  requestAnimationFrame(loop);
}

// Controls
function triggerJump() {
  if (isPlaying) {
    bird.flap();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') triggerJump();
});
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerJump();
});
canvas.addEventListener('mousedown', triggerJump);

// Start Game
startBtn.addEventListener('click', () => {
  startMenu.classList.add('hidden');
  resetGame();
  isPlaying = true;
});

// Restart Game
restartBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  resetGame();
  isPlaying = true;
});

function gameOver() {
  isPlaying = false;
  playAudio(soundHit);
  finalScoreVal.textContent = score;
  gameOverScreen.classList.remove('hidden');
}

function resetGame() {
  bird.reset();
  pipes.reset();
  score = 0;
  frames = 0;
  scoreDisplay.textContent = score;
}

// Start rendering loop initially
loop();
