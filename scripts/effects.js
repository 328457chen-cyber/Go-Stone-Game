/*
  effects.js
  ----------
  אפקט החגיגה: קונפטי וצורות שעפים באוויר, ומילת העידוד כתובה בגדול על המסך.
  קוראים לו מ-game.js:   launchCelebration("Great!", כמה_שורות_נמחקו)

  איך הקונפטי עובד: יש canvas שקוף שמכסה את כל המסך. כל "חלקיק" קונפטי הוא אובייקט
  עם מיקום ומהירות. בכל פריים (requestAnimationFrame) מזיזים את כולם קצת,
  מושכים אותם למטה (כוח המשיכה) ומציירים מחדש. כשהם נעלמים הלולאה נעצרת.
*/

const CONFETTI_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#facc15"];
const CONFETTI_EMOJIS = ["⭐", "✨", "🎉", "💥"];

let confettiCanvas = null;
let confettiCtx = null;
let particles = [];       // כל חלקיקי הקונפטי שעכשיו באוויר
let lastFrameTime = 0;
let isAnimating = false;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== הכנת ה-canvas (נוצר פעם אחת, בפעם הראשונה שצריך) =====
const resizeConfettiCanvas = () => {
  const dpr = window.devicePixelRatio || 1;            // מסכים חדים (אייפון) צריכים יותר פיקסלים
  confettiCanvas.width = window.innerWidth * dpr;
  confettiCanvas.height = window.innerHeight * dpr;
  confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

const ensureConfettiCanvas = () => {
  if (confettiCanvas) return;
  confettiCanvas = document.createElement("canvas");
  confettiCanvas.className = "confetti-canvas";
  document.body.appendChild(confettiCanvas);
  confettiCtx = confettiCanvas.getContext("2d");
  resizeConfettiCanvas();
  window.addEventListener("resize", resizeConfettiCanvas);
};

// ===== יצירת חלקיק אחד שנורה מנקודה (x, y) בזווית ובמהירות נתונות =====
const makeParticle = (x, y, angle, speed, allowEmoji) => {
  const roll = Math.random();
  let shape = "rect";                                   // מלבן קטן (הקונפטי הקלאסי)
  if (roll > 0.55) shape = "circle";
  if (roll > 0.8) shape = "star";
  if (allowEmoji && roll > 0.93) shape = "emoji";

  const life = rand(70, 130);                           // כמה פריימים החלקיק חי
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: shape === "emoji" ? rand(18, 28) : rand(7, 13),
    color: pick(CONFETTI_COLORS),
    emoji: pick(CONFETTI_EMOJIS),
    shape,
    rotation: rand(0, Math.PI * 2),
    spin: rand(-0.3, 0.3),
    flutter: rand(0, Math.PI * 2),                      // גורם למלבנים "להתהפך" באוויר
    life,
    maxLife: life
  };
};

// ===== ציור =====
const drawStarPath = (ctx, radius) => {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
};

const drawParticle = (ctx, p) => {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = Math.min(1, p.life / 30);           // דועך בסוף החיים
  ctx.fillStyle = p.color;

  if (p.shape === "rect") {
    ctx.scale(1, Math.abs(Math.cos(p.flutter)));         // סיבוב תלת-ממדי מדומה
    ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
  } else if (p.shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.shape === "star") {
    drawStarPath(ctx, p.size * 0.8);
  } else {
    ctx.font = `${p.size}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.emoji, 0, 0);
  }
  ctx.restore();
};

// ===== הלולאה: רצה בכל פריים כל עוד יש חלקיקים באוויר =====
const animateConfetti = (now) => {
  const dt = Math.min(2.5, (now - lastFrameTime) / 16.67 || 1);   // מנרמל למסכים מהירים/איטיים
  lastFrameTime = now;

  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles = particles.filter((p) => p.life > 0 && p.y < window.innerHeight + 60);
  particles.forEach((p) => {
    p.vy += 0.35 * dt;                 // כוח המשיכה
    p.vx *= Math.pow(0.985, dt);       // התנגדות האוויר
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.spin * dt;
    p.flutter += 0.2 * dt;
    p.life -= dt;
    drawParticle(confettiCtx, p);
  });

  if (particles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    isAnimating = false;
  }
};

const startConfettiLoop = () => {
  if (isAnimating) return;
  isAnimating = true;
  lastFrameTime = performance.now();
  requestAnimationFrame(animateConfetti);
};

// ===== מילת העידוד כתובה על המסך =====
const showPraiseWord = (word, tier, centerX, centerY) => {
  const el = document.createElement("div");
  el.className = `praise-word tier-${tier}`;
  el.textContent = word;
  el.style.left = `${centerX}px`;
  el.style.top = `${centerY}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);   // מסירים אחרי שהאנימציה נגמרה
};

// ===== רעידת הלוח =====
const shakeBoard = () => {
  const boardEl = document.getElementById("board");
  boardEl.classList.remove("shake");
  void boardEl.offsetWidth;              // טריק שמאפשר להפעיל את האנימציה שוב
  boardEl.classList.add("shake");
  setTimeout(() => boardEl.classList.remove("shake"), 500);
};

// ===== הפונקציה הראשית =====
// tier 1 = שורה אחת (חגיגה קטנה), 2 = שתי שורות, 3 = שלוש ומעלה (חגיגה ענקית)
const launchCelebration = (word, linesCleared) => {
  const tier = Math.min(linesCleared, 3);
  const boardRect = document.getElementById("board").getBoundingClientRect();
  const centerX = boardRect.left + boardRect.width / 2;
  const centerY = boardRect.top + boardRect.height / 2;

  showPraiseWord(word, tier, centerX, centerY);

  if (prefersReducedMotion()) return;    // מי שביקש פחות תנועה מקבל רק את המילה
  if (tier >= 2) shakeBoard();

  ensureConfettiCanvas();

  // פיצוץ קונפטי מאמצע הלוח - לכל הכיוונים, בעיקר למעלה
  const burstCount = { 1: 40, 2: 110, 3: 190 }[tier];
  for (let i = 0; i < burstCount; i++) {
    particles.push(makeParticle(centerX, centerY, rand(-Math.PI * 1.05, Math.PI * 0.05), rand(5, 9 + tier * 4), tier >= 2));
  }

  // שלוש שורות ומעלה: גם "תותחי קונפטי" משתי הפינות התחתונות של המסך
  if (tier >= 3) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    for (let i = 0; i < 70; i++) {
      particles.push(makeParticle(0, H, rand(-1.4, -0.7), rand(14, 24), true));
      particles.push(makeParticle(W, H, rand(-2.45, -1.75), rand(14, 24), true));
    }
  }

  startConfettiLoop();
};
