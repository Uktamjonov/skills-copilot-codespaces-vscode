const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");

const faceImage = new Image();
faceImage.src =
  "https://github.com/user-attachments/assets/1f327156-153f-43ae-a6f3-0060f7d4ec3f";

const state = {
  leftPressed: false,
  rightPressed: false,
  gameOver: false,
  score: 0,
  frame: 0,
  lastShotAt: 0,
  stars: Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 0.5 + Math.random() * 2
  })),
  player: {
    x: canvas.width / 2 - 25,
    y: canvas.height - 70,
    width: 50,
    height: 30,
    speed: 5
  },
  bullets: [],
  enemies: []
};

function drawPlayer() {
  const p = state.player;
  ctx.fillStyle = "#5ad4ff";
  ctx.beginPath();
  ctx.moveTo(p.x + p.width / 2, p.y);
  ctx.lineTo(p.x + p.width, p.y + p.height);
  ctx.lineTo(p.x, p.y + p.height);
  ctx.closePath();
  ctx.fill();
}

function drawBullets() {
  ctx.fillStyle = "#ffe56d";
  state.bullets.forEach((b) => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
}

function drawEnemies() {
  state.enemies.forEach((enemy) => {
    if (faceImage.complete && faceImage.naturalWidth > 0) {
      ctx.drawImage(faceImage, enemy.x, enemy.y, enemy.size, enemy.size);
    } else {
      ctx.fillStyle = "#ff8b8b";
      ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
    }
  });
}

function drawStars() {
  ctx.fillStyle = "#fff";
  state.stars.forEach((s) => {
    ctx.fillRect(s.x, s.y, 2, 2);
  });
}

function drawHud() {
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${state.score}`, 12, 30);
}

function movePlayer() {
  const p = state.player;
  if (state.leftPressed) {
    p.x = Math.max(0, p.x - p.speed);
  }
  if (state.rightPressed) {
    p.x = Math.min(canvas.width - p.width, p.x + p.speed);
  }
}

function updateBullets() {
  state.bullets = state.bullets
    .map((b) => ({ ...b, y: b.y - b.speed }))
    .filter((b) => b.y + b.height > 0);
}

function spawnEnemy() {
  const size = 56;
  const x = Math.random() * (canvas.width - size);
  state.enemies.push({
    x,
    y: -size,
    size,
    speed: 1.3 + Math.random() * 1.6
  });
}

function updateEnemies() {
  state.enemies = state.enemies
    .map((e) => ({ ...e, y: e.y + e.speed }))
    .filter((e) => e.y < canvas.height + e.size);
}

function updateStars() {
  state.stars = state.stars.map((s) => {
    const y = s.y + s.speed;
    return {
      ...s,
      y: y > canvas.height ? 0 : y,
      x: y > canvas.height ? Math.random() * canvas.width : s.x
    };
  });
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function resolveHits() {
  const bulletToRemove = new Set();
  const enemyToRemove = new Set();

  state.bullets.forEach((bullet, bi) => {
    const bulletBox = {
      x: bullet.x,
      y: bullet.y,
      width: bullet.width,
      height: bullet.height
    };

    state.enemies.forEach((enemy, ei) => {
      const enemyBox = {
        x: enemy.x,
        y: enemy.y,
        width: enemy.size,
        height: enemy.size
      };
      if (isColliding(bulletBox, enemyBox)) {
        bulletToRemove.add(bi);
        enemyToRemove.add(ei);
        state.score += 10;
      }
    });
  });

  state.bullets = state.bullets.filter((_, i) => !bulletToRemove.has(i));
  state.enemies = state.enemies.filter((_, i) => !enemyToRemove.has(i));
}

function checkGameOver() {
  const playerBox = {
    x: state.player.x,
    y: state.player.y,
    width: state.player.width,
    height: state.player.height
  };

  for (const enemy of state.enemies) {
    const enemyBox = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.size,
      height: enemy.size
    };
    if (isColliding(playerBox, enemyBox) || enemy.y + enemy.size >= canvas.height) {
      state.gameOver = true;
      statusText.textContent = `Game over — Score: ${state.score}. Press R to restart.`;
      break;
    }
  }
}

function fireBullet() {
  if (state.gameOver) {
    return;
  }

  const now = Date.now();
  if (now - state.lastShotAt < 180) {
    return;
  }

  state.lastShotAt = now;
  state.bullets.push({
    x: state.player.x + state.player.width / 2 - 3,
    y: state.player.y - 12,
    width: 6,
    height: 14,
    speed: 8
  });
}

function resetGame() {
  state.gameOver = false;
  state.score = 0;
  state.frame = 0;
  state.lastShotAt = 0;
  state.player.x = canvas.width / 2 - state.player.width / 2;
  state.bullets = [];
  state.enemies = [];
  statusText.textContent = "";
}

function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawHud();
  drawPlayer();
  drawBullets();
  drawEnemies();

  if (!state.gameOver) {
    state.frame += 1;
    movePlayer();
    updateBullets();
    updateEnemies();
    updateStars();
    resolveHits();
    checkGameOver();

    if (state.frame % 45 === 0) {
      spawnEnemy();
    }
  }

  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    state.leftPressed = true;
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    state.rightPressed = true;
  }
  if (event.code === "Space") {
    event.preventDefault();
    fireBullet();
  }
  if (event.code === "KeyR" && state.gameOver) {
    resetGame();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    state.leftPressed = false;
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    state.rightPressed = false;
  }
});

faceImage.addEventListener("error", () => {
  statusText.textContent = "Image failed to load, fallback enemy style enabled.";
});

tick();
