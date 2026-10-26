const LEVEL_LABELS = { fast: "מהיר", medium: "בינוני", slow: "איטי" };
const adminPlayer = requireLogin("admin");
if (adminPlayer) initAdmin();
function initAdmin() {
  const usersBody = document.getElementById("usersBody");
  const scoresBody = document.getElementById("scoresBody");
  const noUsers = document.getElementById("noUsers");
  const noScores = document.getElementById("noScores");
  const userSearch = document.getElementById("userSearch");
  const toggleCodesBtn = document.getElementById("toggleCodes");
  const deleteDialog = document.getElementById("deleteDialog");
  const deleteText = document.getElementById("deleteText");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const toastEl = document.getElementById("toast");

  let showCodes = false;      // האם להציג את הקודים או נקודות
  let searchTerm = "";
  let pendingDelete = null;
   
  const makeCell = (text, label, className) => {
    const td = document.createElement("td");
    td.textContent = text;
    td.dataset.label = label;
    if (className) td.className = className;
    return td;
  };
  // ===== סטטיסטיקות =====
  const renderStats = () => {
    const users = getUsers();
    const scores = getScores();
    document.getElementById("statUsers").textContent = users.length;
    document.getElementById("statGames").textContent = scores.length;
    document.getElementById("statBest").textContent = scores.length ? Math.max(...scores.map((s) => s.score)) : 0;
  };

  // ===== טבלת משתמשים =====
  const renderUsers = () => {
    const term = searchTerm.trim().toLowerCase();
    const visible = getUsers().filter(
      (u) => (u.username || "").toLowerCase().includes(term) || (u.email || "").includes(term)   // filter + includes
    );

    usersBody.innerHTML = "";
    noUsers.classList.toggle("hidden", visible.length > 0);

    visible.forEach((user, index) => {
      const row = document.createElement("tr");
      row.id = `user-row-${index}`;

      const actionCell = document.createElement("td");
      actionCell.dataset.label = "פעולות";
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn danger small";
      deleteBtn.textContent = "מחיקה";
      deleteBtn.dataset.username = user.username;
      deleteBtn.addEventListener("click", () => askDelete(user));
      actionCell.appendChild(deleteBtn);

      row.append(
        makeCell(index + 1, "#"),
        makeCell(user.username, "שם"),
        makeCell(user.email || "-", "מייל", "ltr"),
        makeCell(showCodes ? (user.password || "-") : "••••••", "קוד", "ltr code"),
        makeCell(user.createdAt || "-", "נרשם"),
        actionCell
      );
      usersBody.appendChild(row);
    });
  };

  // ===== טבלת שיאים =====
  const renderScores = () => {
    const scores = [...getScores()].sort((a, b) => b.score - a.score);
    scoresBody.innerHTML = "";
    noScores.classList.toggle("hidden", scores.length > 0);

    scores.map((entry, index) => {
      const row = document.createElement("tr");
      row.id = `score-row-${index}`;
      row.append(
        makeCell(index + 1, "#"),
        makeCell(entry.name, "שם"),
        makeCell(entry.email || "-", "מייל", "ltr"),
        makeCell(entry.score, "ניקוד"),
        makeCell(LEVEL_LABELS[entry.level] || entry.level, "רמה"),
        makeCell(entry.date, "תאריך")
      );
      scoresBody.appendChild(row);
      return row;
    });
  };

  const renderAll = () => {
    renderStats();
    renderUsers();
    renderScores();
  };

  // ===== הצגה/הסתרה של קודים =====
  toggleCodesBtn.addEventListener("click", () => {
    showCodes = !showCodes;
    toggleCodesBtn.textContent = showCodes ? "הסתרת קודים" : "הצגת קודים";
    renderUsers();
  });

  // ===== חיפוש - אירוע input (מתעדכן תוך כדי הקלדה) =====
  userSearch.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderUsers();
  });

  // ===== מחיקה עם אישור =====
  const askDelete = (user) => {
    pendingDelete = user;
    deleteText.textContent = `למחוק את ${user.username}${user.email ? ` (${user.email})` : ""}? רק המשתמש הזה יימחק, וגם השיאים שלו. אי אפשר לבטל.`;
    deleteDialog.showModal();
  };

  confirmDeleteBtn.addEventListener("click", () => {
    if (pendingDelete) {
      deleteUser(pendingDelete.username); // מוחקים משתמש אחד בלבד
      showToast(`${pendingDelete.username} נמחק/ה`);
      pendingDelete = null;
    }
    deleteDialog.close();
    renderAll();
  });

  cancelDeleteBtn.addEventListener("click", () => {
    pendingDelete = null;
    deleteDialog.close();
  });

  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  renderAll();
}
