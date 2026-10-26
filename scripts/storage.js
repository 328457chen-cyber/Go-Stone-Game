const USERS_KEY = "gostone_users";
const SCORES_KEY = "gostone_scores";
const CURRENT_PLAYER_KEY = "gostone_currentPlayer";
// ===== משתמשים רשומים (localStorage) =====
// כל משתמש: { username, email, password, createdAt }  (שם המשתמש ייחודי, ובו מתחברים)

const getUsers = () => {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveUsers = (usersArray) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(usersArray));
};

// ===== המשתמש המחובר כרגע (sessionStorage) =====
// { username, email, role }  - role הוא "player" או "admin"

const setCurrentPlayer = (playerObj) => {
  sessionStorage.setItem(CURRENT_PLAYER_KEY, JSON.stringify(playerObj));
};

const getCurrentPlayer = () => {
  const raw = sessionStorage.getItem(CURRENT_PLAYER_KEY);
  return raw ? JSON.parse(raw) : null;
};

const clearCurrentPlayer = () => {
  sessionStorage.removeItem(CURRENT_PLAYER_KEY);
};

// ===== טבלת שיאים (localStorage) =====
// כל שיא: { name, email, score, level, date }

const getScores = () => {
  const raw = localStorage.getItem(SCORES_KEY);
  return raw ? JSON.parse(raw) : [];
};

const addScore = (scoreObj) => {
  const scores = getScores();
  scores.push(scoreObj);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
};

// ===== מחיקת משתמש (למנהל) =====
// מוחקת משתמש אחד בלבד, לפי שם המשתמש (שהוא ייחודי), ואת השיאים שלו.
// splice מסיר איבר אחד בלבד מהמערך, כך שאף משתמש אחר לא נפגע.
const deleteUser = (username) => {
  const users = getUsers();
  const index = users.findIndex((u) => u.username === username);
  if (index === -1) return;

  users.splice(index, 1);
  saveUsers(users);
  localStorage.setItem(SCORES_KEY, JSON.stringify(getScores().filter((s) => s.name !== username)));
};

// ===== הגנה על דפים =====
// קוראים לה בתחילת כל דף מוגן. אם אין משתמש מחובר (או שהמנהל מחק אותו),
// מחזירים לדף הכניסה. מחזירה את המשתמש המחובר, או null אם הועבר החוצה.
const requireLogin = (requiredRole) => {
  const player = getCurrentPlayer();

  const deleted = player && player.role === "player" && !getUsers().some((u) => u.username === player.username);
  const wrongRole = player && requiredRole && player.role !== requiredRole;

  if (!player || deleted || wrongRole) {
    if (deleted) clearCurrentPlayer();
    window.location.href = "../index.html";
    return null;
  }
  return player;
};
