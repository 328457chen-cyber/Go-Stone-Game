// פרטי חשבון המנהל הקבוע (בפרויקט אמיתי זה היה מאובטח בצד שרת)
const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

// ===== אלמנטים מה-DOM =====
const authForm = document.getElementById("authForm");
const usernameInput = document.getElementById("username");
const emailField = document.getElementById("emailField");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const adminLoginBtn = document.getElementById("adminLoginBtn"); // תפיסת כפתור המנהל החדש
const submitBtn = document.getElementById("submitBtn");
const authMessage = document.getElementById("authMessage");
const authSub = document.getElementById("authSub");
const tabs = document.querySelectorAll(".tab");

let mode = "login";

// ===== מעבר בין התחברות להרשמה =====
const setMode = (newMode) => {
  mode = newMode;
  const isRegister = mode === "register";

  tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  emailField.classList.toggle("hidden", !isRegister);   // מייל רק בהרשמה
  if (adminLoginBtn) {
    adminLoginBtn.classList.toggle("hidden", isRegister); // כפתור מנהל מוצג רק בהתחברות
  }
  passwordInput.autocomplete = isRegister ? "new-password" : "current-password";

  submitBtn.textContent = isRegister ? "יצירת חשבון" : "התחברות";
  authSub.textContent = isRegister ? "פותחים חשבון חדש בכמה שניות" : "התחברו עם שם משתמש וסיסמה";
  showMessage("", false);
};

tabs.forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));

const authMenuBtn = document.getElementById("authMenuBtn");
const authMenu = document.getElementById("authMenu");

if (authMenuBtn && authMenu) {
  const setAuthMenuOpen = (open) => {
    authMenu.classList.toggle("open", open);
    authMenuBtn.classList.toggle("open", open);
    authMenuBtn.setAttribute("aria-expanded", String(open));
  };

  authMenuBtn.addEventListener("click", () => {
    setAuthMenuOpen(!authMenu.classList.contains("open"));
  });

  authMenu.querySelectorAll("[data-auth-mode]").forEach((item) => {
    item.addEventListener("click", () => {
      setMode(item.dataset.authMode);
      setAuthMenuOpen(false);
      usernameInput.focus();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setAuthMenuOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (!authMenuBtn.contains(event.target) && !authMenu.contains(event.target)) {
      setAuthMenuOpen(false);
    }
  });
}

// ===== בדיקות קלט =====
const cleanText = (raw) => raw.trim().replace(/\s+/g, " ");           // trim + replace
const isValidEmail = (email) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
const hasBadChars = (text) => text.includes("<") || text.includes(">"); // includes
const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();         // שם משתמש בלי רגישות לאותיות

// ===== בלחיצה על כפתור כניסת מנהל =====
if (adminLoginBtn) {
  adminLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const username = cleanText(usernameInput.value);
    const password = passwordInput.value;

    if (!username || !password) {
      showMessage("יש למלא שם משתמש וסיסמה כדי להיכנס כמנהל", true);
      return;
    }

    if (sameName(username, ADMIN_CREDENTIALS.username) && password === ADMIN_CREDENTIALS.password) {
      logInAndRedirect({ username: "מנהל", email: "", role: "admin" }, "pages/admin.html");
    } else {
      showMessage("פרטי המנהל שגויים", true);
    }
  });
}

// ===== שליחת הטופס (משתמשים רגילים) =====
authForm.addEventListener("submit", (event) => {
  event.preventDefault(); // מונע רענון עמוד

  const username = cleanText(usernameInput.value);
  const password = passwordInput.value;

  if (username.length < 2 || hasBadChars(username)) {
    showMessage("שם משתמש צריך להכיל לפחות 2 תווים, בלי < או >", true);
    return;
  }
  if (password.length < 4) {
    showMessage("הסיסמה צריכה להכיל לפחות 4 תווים", true);
    return;
  }

  const users = getUsers();

  // ----- הרשמה: שם משתמש + מייל + סיסמה -----
  if (mode === "register") {
    const email = emailInput.value.trim().toLowerCase();

    if (!isValidEmail(email)) {
      showMessage("יש להזין כתובת מייל תקינה", true);
      return;
    }
    if (sameName(username, ADMIN_CREDENTIALS.username) || users.some((u) => sameName(u.username || "", username))) {
      showMessage("שם המשתמש הזה תפוס, נסו שם אחר", true);
      return;
    }
    if (users.find((u) => u.email === email)) {
      showMessage("המייל הזה כבר רשום. עברו להתחברות", true);
      return;
    }

    users.push({ username, email, password, createdAt: new Date().toLocaleDateString("he-IL") });
    saveUsers(users);
    logInAndRedirect({ username, email, role: "player" }, "pages/menu.html");
    return;
  }

  // ----- התחברות רגילה: שם משתמש + סיסמה -----
  const found = users.find((u) => sameName(u.username || "", username));

  if (!found || found.password !== password) {
    showMessage("שם המשתמש או הסיסמה שגויים", true);
    return;
  }
  logInAndRedirect({ username: found.username, email: found.email || "", role: "player" }, "pages/menu.html");
});

function showMessage(text, isError) {
  authMessage.textContent = text;
  authMessage.classList.toggle("error", Boolean(text) && isError);
  authMessage.classList.toggle("success", Boolean(text) && !isError);
}

// שומרת את המשתמש כמחובר, ואחרי רגע קצר (setTimeout) עוברת לדף הבא
function logInAndRedirect(user, destination) {
  setCurrentPlayer(user);
  showMessage("מתחברים...", false);
  setTimeout(() => {
    window.location.href = destination;
  }, 500);
}