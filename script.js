const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score-display');
const startMenu = document.getElementById('start-menu');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreVal = document.getElementById('final-score-val');

// ജമ്പ് സൗണ്ട്
const soundJump = document.getElementById('sound-jump');

// 3 വ്യത്യസ്ത സ്കോർ സൗണ്ടുകൾ
const scoreSounds = [
  document.getElementById('sound-score-1'),
  document.getElementById('sound-score-2'),
  document.getElementById('sound-score-3')
];
let currentScoreSoundIndex = 0;

// 3 വ്യത്യസ്ത ഹിറ്റ് സൗണ്ടുകൾ
const hitSounds = [
  document.getElementById('sound-hit-1'),
  document.getElementById('sound-hit-2'),
  document.getElementById('sound-hit-3')
];
let currentHitSoundIndex = 0;

function playAudio(audio) {
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

// സ്കോർ ചെയ്യുമ്പോൾ മാറിമാറി പ്ലേ ആകുന്ന ഫംഗ്ഷൻ (1 -> 2 -> 3 -> 1...)
function playScoreSound() {
  playAudio(scoreSounds[currentScoreSoundIndex]);
  currentScoreSoundIndex = (currentScoreSoundIndex + 1) % scoreSounds.length;
}

// തട്ടുമ്പോൾ മാറിമാറി പ്ലേ ആകുന്ന ഫംഗ്ഷൻ (1 -> 2 -> 3 -> 1...)
function playHitSound() {
  playAudio(hitSounds[currentHitSoundIndex]);
  currentHitSoundIndex = (currentHitSoundIndex + 1) % hitSounds.length;
}

// ഗെയിം സ്റ്റേറ്റ്
let isPlaying = false;
let frames = 0;
let score = 0;

// ഒന്നിടവിട്ട ജമ്പ് സൗണ്ട് ടോഗിൾ
let shouldPlayJumpSound = true;

// പക്ഷി (Bird)
const bird = {
  x: 55,
  y: 200,
  radius: 12,
  gravity: 0.25,
  velocity: 0,
  jumpStrength: -4.8,

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // ടിൽറ്റ് ആനിമേഷൻ
    let angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 4) * Math.PI / 180));
    ctx.rotate(angle);

    // ശരീരം
    ctx.fillStyle = '#f7dc6f';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // കണ്ണ്
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(4, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(6, -4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // കൊക്ക്
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

    // ഒന്നിടവിട്ട് മാത്രം ജമ്പ് സൗണ്ട് പ്ലേ ചെയ്യുന്നു
    if (shouldPlayJumpSound) {
      playAudio(soundJump);
    }
    shouldPlayJumpSound = !shouldPlayJumpSound;
  },

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    // തറയിൽ തട്ടുമ്പോൾ തോൽക്കുന്നു
    if (this.y + this.radius >= canvas.height - 70) {
      this.y = canvas.height - 70 - this.radius;
      gameOver();
    }
    // മുകളിലെ പരിധി
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

// തൂണുകൾ (Pipes)
const pipes = {
  items: [],
  gap: 115,
  width: 52,
  dx: 1.8,

  draw() {
    for (let p of this.items) {
      ctx.fillStyle = '#73bf2e';
      ctx.strokeStyle = '#543847';
      ctx.lineWidth = 2;

      // മുകളിലെ പൈപ്പ്
      ctx.fillRect(p.x, 0, this.width, p.top);
      ctx.strokeRect(p.x, 0, this.width, p.top);
      ctx.fillRect(p.x - 2, p.top - 18, this.width + 4, 18);
      ctx.strokeRect(p.x - 2, p.top - 18, this.width + 4, 18);

      // താഴത്തെ പൈപ്പ്
      let bottomY = p.top + this.gap;
      let bottomH = canvas.height - 70 - bottomY;
      ctx.fillRect(p.x, bottomY, this.width, bottomH);
      ctx.strokeRect(p.x, bottomY, this.width, bottomH);
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

      // കൂട്ടിയിടി പരിശോധിക്കുന്നു
      if (
        bird.x + bird.radius > p.x &&
        bird.x - bird.radius < p.x + this.width
      ) {
        if (bird.y - bird.radius < p.top || bird.y + bird.radius > p.top + this.gap) {
          gameOver();
          return;
        }
      }

      // സ്കോർ സൗണ്ട് മാറിമാറി പ്ലേ ചെയ്യുന്നു
      if (p.x + this.width < bird.x && !p.passed) {
        score++;
        p.passed = true;
        scoreDisplay.textContent = score;
        playScoreSound();
      }

      // സ്ക്രീനിന് പുറത്തായവ ഒഴിവാക്കുന്നു
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

// പശ്ചാത്തലവും തറയും
function drawBackground() {
  ctx.fillStyle = '#70c5ce';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

  ctx.fillStyle = '#73bf2e';
  ctx.fillRect(0, canvas.height - 70, canvas.width, 12);
  ctx.strokeStyle = '#543847';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, canvas.height - 70, canvas.width, 12);
}

// മെയിൻ ലൂപ്പ്
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

// ടച്ച് & ക്ലിക്ക് കൺട്രോൾ
function handleInteraction(e) {
  if (e) {
    e.preventDefault();
  }
  if (isPlaying) {
    bird.flap();
  }
}

// PC: Spacebar
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    handleInteraction();
  }
});

// മൊബൈൽ ടച്ചും മൗസ് ക്ലിക്കും
canvas.addEventListener('touchstart', handleInteraction, { passive: false });
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) handleInteraction(e);
});

// ഗെയിം തുടങ്ങാൻ
startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startMenu.classList.add('hidden');
  resetGame();
  isPlaying = true;
});

// റീപ്ലേ ചെയ്യാൻ
restartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  gameOverScreen.classList.add('hidden');
  resetGame();
  isPlaying = true;
});

function gameOver() {
  isPlaying = false;
  playHitSound(); // ഓരോ തവണ തോൽക്കുമ്പോഴും hit1 -> hit2 -> hit3 മാറിമാറി പ്ലേ ആകുന്നു
  finalScoreVal.textContent = score;
  gameOverScreen.classList.remove('hidden');
}

function resetGame() {
  bird.reset();
  pipes.reset();
  score = 0;
  frames = 0;
  scoreDisplay.textContent = score;
  shouldPlayJumpSound = true;
}

// ഗെയിം ആരംഭിക്കുന്നു
loop();
