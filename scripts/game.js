/*
  game.js
  -------
  מפעיל את המשחק: קורא את הרמה מה-URL (query parameter), מנהל טיימר,
  גרירת צורות ללוח (Pointer Events - עובד גם בעכבר וגם במגע), ניקוד,
  ושומר את התוצאה בטבלת השיאים בסיום.
*/

// ===== הגדרות רמה (אובייקט ליטרלי) =====
const LEVEL_TIME = { fast: 15, medium: 30, slow: 60 };          // שניות לכל סבב של 3 צורות
const LEVEL_LABELS = { fast: "מהיר", medium: "בינוני", slow: "איטי" };

// ===== קליטת הרמה מה-URL: game.html?level=fast =====
const urlParams = new URLSearchParams(window.location.search);
const requestedLevel = urlParams.get("level");
const levelKey = Object.keys(LEVEL_TIME).includes(requestedLevel) ? requestedLevel : "medium";
const timePerRound = LEVEL_TIME[levelKey];

// ===== משתני מצב =====
let currentShapes = [];     // 3 הצורות הנוכחיות (null = צורה שכבר הונחה)
let score = 0;
let timeLeft = 0;
let timerInterval = null;
let isGameOver = false;
let isPaused = false;
let timerDeadline = 0;

// ===== אלמנטים מה-DOM =====
const boardEl = document.getElementById("board");
const trayEl = document.getElementById("tray");
const scoreValueEl = document.getElementById("scoreValue");
const levelLabelEl = document.getElementById("levelLabel");
const timerValueEl = document.getElementById("timerValue");
const timerBarEl = document.getElementById("timerBar");
const toastEl = document.getElementById("toast");
const helpBtn = document.getElementById("helpBtn");
const pauseBtn = document.getElementById("pauseBtn");
const finishBtn = document.getElementById("finishBtn");
const helpDialog = document.getElementById("helpDialog");
const closeHelpBtn = document.getElementById("closeHelpBtn");
const finishDialog = document.getElementById("finishDialog");
const cancelFinishBtn = document.getElementById("cancelFinishBtn");
const confirmFinishBtn = document.getElementById("confirmFinishBtn");
const gameOverDialog = document.getElementById("gameOverDialog");
const gameOverReasonEl = document.getElementById("gameOverReason");
const finalScoreEl = document.getElementById("finalScore");
const playAgainLink = document.getElementById("playAgainLink");

const player = requireLogin();

// ===== התחלת משחק =====
function startGame() {
  score = 0;
  isGameOver = false;
  scoreValueEl.textContent = score;
  levelLabelEl.textContent = LEVEL_LABELS[levelKey];

  createEmptyGrid();
  renderBoard();
  nextRound();
}

// סבב חדש: 3 צורות חדשות וטיימר מאופס
function nextRound() {
  currentShapes = generateThreeShapes();
  renderTray();
  resetTimer();

  // אם אף צורה חדשה לא נכנסת - אין טעם לחכות
  if (!isAnyPlacementPossible(currentShapes)) gameOver("nospace");
}

// ===== מגש הצורות =====
// כל צורה במגש היא רשת קטנה של div-ים; רק תאים שערכם 1 נצבעים
function renderTray() {
  trayEl.innerHTML = "";

  currentShapes.forEach((shape, index) => {
    const pieceEl = document.createElement("div");
    pieceEl.classList.add("shape-piece");
    pieceEl.dataset.index = index;

    if (!shape) {
      pieceEl.classList.add("used");
      trayEl.appendChild(pieceEl);
      return;
    }

    pieceEl.style.gridTemplateColumns = `repeat(${shape[0].length}, var(--mini))`;
    shape.forEach((row) => {
      row.forEach((val) => {
        const miniCell = document.createElement("div");
        miniCell.classList.add("mini-cell");
        if (val === 1) miniCell.classList.add("on");
        pieceEl.appendChild(miniCell);
      });
    });

    pieceEl.addEventListener("pointerdown", (e) => startDrag(e, index));
    trayEl.appendChild(pieceEl);
  });
}

// ===================== טיימר - פס שמתרוקן =====================

const tick = () => {
  timeLeft = Math.max(0, (timerDeadline - Date.now()) / 1000);
  timerValueEl.textContent = Math.ceil(timeLeft);

  const ratio = timeLeft / timePerRound;
  timerBarEl.classList.toggle("warning", ratio <= 0.5 && ratio > 0.2);
  timerBarEl.classList.toggle("danger", ratio <= 0.2);

  if (timeLeft <= 0) gameOver("time");
};

// מפעילה ספירה לאחור + אנימציית התרוקנות של הפס לפי הזמן שנותר
const runTimer = () => {
  if (isPaused || isGameOver || helpDialog.open || finishDialog.open) return;
  clearInterval(timerInterval);
  timerDeadline = Date.now() + timeLeft * 1000;
  timerBarEl.style.transition = `width linear ${timeLeft}s, background 0.4s ease`;
  timerBarEl.style.width = "0%";
  timerInterval = setInterval(tick, 100);
};

// בפריים הבא (אחרי שהדפדפן צייר 100%) מתחילים להתרוקן
const runTimerNextFrame = () => requestAnimationFrame(() => requestAnimationFrame(runTimer));

function resetTimer() {
  clearInterval(timerInterval);
  isPaused = false;
  updatePauseButton();
  timeLeft = timePerRound;
  timerValueEl.textContent = timeLeft;

  timerBarEl.style.transition = "none";
  timerBarEl.style.width = "100%";
  timerBarEl.classList.remove("warning", "danger");
  runTimerNextFrame();
}

// עצירה: מקפיאים את הפס ברוחב הנוכחי שלו
const pauseTimer = () => {
  clearInterval(timerInterval);
  if (timerDeadline) {
    timeLeft = Math.max(0, (timerDeadline - Date.now()) / 1000);
    timerValueEl.textContent = Math.ceil(timeLeft);
  }
  const trackWidth = timerBarEl.parentElement.getBoundingClientRect().width;
  const currentWidth = timerBarEl.getBoundingClientRect().width;
  timerBarEl.style.transition = "none";
  if (trackWidth > 0) timerBarEl.style.width = `${(currentWidth / trackWidth) * 100}%`;
};

function updatePauseButton() {
  const paused = isPaused;
  pauseBtn.classList.toggle("is-paused", paused);
  pauseBtn.setAttribute("aria-pressed", String(paused));
  pauseBtn.setAttribute("aria-label", paused ? "המשך המשחק" : "עצירת המשחק");
  pauseBtn.title = paused ? "המשך המשחק" : "עצירת המשחק";
}

function togglePause() {
  if (isGameOver || helpDialog.open || finishDialog.open) return;
  cancelDrag();
  isPaused = !isPaused;
  updatePauseButton();
  if (isPaused) pauseTimer();
  else runTimerNextFrame();
}

// ===================== גרירה (Pointer Events) =====================

let dragGhost = null;       // העתק צף של הצורה שעוקב אחרי האצבע/העכבר
let draggingShape = null;
let draggingIndex = null;
let lastStart = null;       // {row, col} - איפה הצורה תונח אם משחררים עכשיו
let dragOffsetY = 0;        // במגע מרימים את הצורה מעל האצבע כדי שלא תוסתר

function startDrag(e, index) {
  const shape = currentShapes[index];
  if (!shape || isGameOver || isPaused) return;

  e.preventDefault();
  draggingShape = shape;
  draggingIndex = index;
  lastStart = null;
  dragOffsetY = e.pointerType === "touch" ? 64 : 0;

  // ההעתק הצף באותו גודל של תא בלוח (הלוח משתנה לפי רוחב המסך)
  const sampleCell = boardEl.querySelector(".cell");
  const size = sampleCell ? sampleCell.offsetWidth : 28;

  dragGhost = document.createElement("div");
  dragGhost.classList.add("drag-ghost");
  dragGhost.style.gridTemplateColumns = `repeat(${shape[0].length}, ${size}px)`;

  shape.forEach((row) => {
    row.forEach((val) => {
      const c = document.createElement("div");
      c.style.width = `${size}px`;
      c.style.height = `${size}px`;
      if (val === 1) c.classList.add("ghost-cell");
      dragGhost.appendChild(c);
    });
  });
  document.body.appendChild(dragGhost);

  const originalEl = trayEl.querySelector(`.shape-piece[data-index="${index}"]`);
  if (originalEl) originalEl.classList.add("dragging");

  moveGhost(e.clientX, e.clientY);
  updatePreview(e.clientX, e.clientY);

  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
}

function moveGhost(x, y) {
  if (!dragGhost) return;
  dragGhost.style.left = `${x - dragGhost.offsetWidth / 2}px`;
  dragGhost.style.top = `${y - dragOffsetY - dragGhost.offsetHeight / 2}px`;
}

function onDragMove(e) {
  moveGhost(e.clientX, e.clientY);
  updatePreview(e.clientX, e.clientY);
}

// מחזירה את התא בלוח שנמצא מתחת לנקודה (x, y), או null אם הנקודה מחוץ ללוח.
// מחשבים לפי מידות הלוח ולא לפי elementFromPoint, כדי שגם הרווחים בין התאים ייחשבו.
const getBoardCellAt = (x, y) => {
  const rect = boardEl.getBoundingClientRect();
  const pad = parseFloat(getComputedStyle(boardEl).paddingLeft) || 0;
  const pitch = (rect.width - pad * 2) / BOARD_SIZE;
  const col = Math.floor((x - rect.left - pad) / pitch);
  const row = Math.floor((y - rect.top - pad) / pitch);
  const inside = row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  return inside ? { row, col } : null;
};

// מסמנת בירוק/אדום איפה הצורה תונח אם משחררים עכשיו
function updatePreview(x, y) {
  clearPreview();

  const hovered = getBoardCellAt(x, y - dragOffsetY);
  if (!hovered) {
    lastStart = null;
    return;
  }

  // ממרכזים את הצורה סביב התא שמתחתיה
  const startRow = hovered.row - Math.floor(draggingShape.length / 2);
  const startCol = hovered.col - Math.floor(draggingShape[0].length / 2);
  lastStart = { row: startRow, col: startCol };

  const valid = canPlaceShape(draggingShape, startRow, startCol);

  draggingShape.forEach((rowArr, r) => {
    rowArr.forEach((val, c) => {
      if (val !== 1) return;
      const cellEl = boardEl.querySelector(`.cell[data-row="${startRow + r}"][data-col="${startCol + c}"]`);
      if (cellEl) cellEl.classList.add(valid ? "preview-ok" : "preview-bad");
    });
  });
}

function clearPreview() {
  boardEl.querySelectorAll(".preview-ok, .preview-bad").forEach((el) => {
    el.classList.remove("preview-ok", "preview-bad");
  });
}

// מנקה את כל מה שקשור לגרירה (בלי להניח כלום)
function cancelDrag() {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragEnd);

  clearPreview();
  if (dragGhost) {
    dragGhost.remove();
    dragGhost = null;
  }
  const originalEl = trayEl.querySelector(`.shape-piece[data-index="${draggingIndex}"]`);
  if (originalEl) originalEl.classList.remove("dragging");

  draggingShape = null;
  draggingIndex = null;
}

function onDragEnd(e) {
  const shape = draggingShape;
  const index = draggingIndex;
  const start = lastStart;

  cancelDrag();
  lastStart = null;

  if (e.type === "pointercancel" || isGameOver || !shape || !start) return; // שחררו מחוץ ללוח

  if (!canPlaceShape(shape, start.row, start.col)) {
    playErrorSound();
    return;
  }
  commitPlacement(shape, index, start);
}

// ===== הנחה מוצלחת של צורה =====
function commitPlacement(shape, index, start) {
  placeShape(shape, start.row, start.col);
  currentShapes[index] = null; // הצורה הזו נוצלה
  playPlaceSound();

  // ניקוד: נקודה לכל קובייה + 10 לכל שורה/טור שנמחק
  score += shape.flat().filter((v) => v === 1).length;

  const linesCleared = clearFullLines();
  if (linesCleared > 0) {
    score += linesCleared * 10;
    showToast(`+${linesCleared * 10}`);
    const praiseWord = celebrateLinesCleared(linesCleared); // צליל + מילת עידוד (או null)
    if (praiseWord) launchCelebration(praiseWord, linesCleared); // קונפטי ומילת העידוד על המסך
  }

  scoreValueEl.textContent = score;
  renderBoard();
  renderTray();

  const shapesLeft = currentShapes.filter((s) => s !== null);

  if (shapesLeft.length === 0) {
    nextRound(); // כל 3 הצורות הונחו - מגרילים 3 חדשות
  } else if (!isAnyPlacementPossible(shapesLeft)) {
    gameOver("nospace");
  }
}

// ===================== הוראות מהירות (dialog) =====================

const openHelp = () => {
  if (isGameOver || isPaused || helpDialog.open || finishDialog.open) return;
  cancelDrag();
  pauseTimer(); // בזמן שהחלונית פתוחה הזמן עומד
  helpDialog.showModal();
};

helpBtn.addEventListener("click", openHelp);
closeHelpBtn.addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("close", () => {
  if (!isGameOver && !isPaused) runTimerNextFrame(); // ממשיכים מאותה נקודה
});

pauseBtn.addEventListener("click", togglePause);

let wasPausedBeforeFinish = false;
finishBtn.addEventListener("click", () => {
  if (isGameOver || helpDialog.open || finishDialog.open) return;
  cancelDrag();
  wasPausedBeforeFinish = isPaused;
  pauseTimer();
  finishDialog.showModal();
});

cancelFinishBtn.addEventListener("click", () => finishDialog.close());
confirmFinishBtn.addEventListener("click", () => {
  finishDialog.close();
  gameOver("manual");
});
finishDialog.addEventListener("close", () => {
  if (isGameOver) return;
  isPaused = wasPausedBeforeFinish;
  updatePauseButton();
  if (!isPaused) runTimerNextFrame();
});

// מקש H במחשב (event.code עובד גם כשהמקלדת בעברית)
document.addEventListener("keydown", (event) => {
  if (event.code === "KeyH") openHelp();
});

// ===================== סיום משחק =====================

function gameOver(reason) {
  if (isGameOver) return; // מגנים משמירה כפולה
  isGameOver = true;
  isPaused = false;
  updatePauseButton();

  cancelDrag();
  pauseTimer();
  playGameOverSound();

  addScore({
    userId: player.id,
    name: player.username,
    email: player.email,
    score,
    level: levelKey,
    date: new Date().toLocaleDateString("he-IL")
  });

  finalScoreEl.textContent = score;
  gameOverReasonEl.textContent = reason === "time"
    ? "הזמן נגמר לפני שהוכנסו כל הצורות"
    : reason === "manual"
      ? "המשחק הסתיים לבקשתך. הניקוד נשמר בטבלת השיאים."
      : "אין יותר מקום בלוח לצורה שנותרה";
  playAgainLink.href = `game.html?level=${levelKey}`; // מאפיין href שנקבע בקוד
  gameOverDialog.showModal();
}

// בחלון הסיום אי אפשר לסגור עם Escape - חייבים לבחור לאן ממשיכים
gameOverDialog.addEventListener("cancel", (event) => event.preventDefault());

// ===== הודעה קצרה שנעלמת לבד (setTimeout) =====
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1000);
}

// ===== התחלה: נקראת בסוף הקובץ, אחרי שכל הפונקציות והמשתנים הוגדרו =====
if (player) startGame();
