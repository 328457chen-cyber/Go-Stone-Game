const LEVEL_LABELS = { fast: "מהיר", medium: "בינוני", slow: "איטי" };

const boardPlayer = requireLogin();
if (boardPlayer) initLeaderboard(boardPlayer);

function initLeaderboard(player) {
  const scoresBody = document.getElementById("scoresBody");
  const emptyMessage = document.getElementById("emptyMessage");
  const levelFilter = document.getElementById("levelFilter");

  // יוצרת תא טבלה. data-label משמש את ה-CSS בתצוגת מובייל (כל שורה הופכת לכרטיס)
  const makeCell = (text, label) => {
    const td = document.createElement("td");
    td.textContent = text;
    td.dataset.label = label;
    return td;
  };
   const render = (level) => {
    const all = getScores();
    const filtered = level === "all" ? all : all.filter((s) => s.level === level); // filter
    const sorted = [...filtered].sort((a, b) => b.score - a.score);                // sort

    scoresBody.innerHTML = "";
    emptyMessage.classList.toggle("hidden", sorted.length > 0);

    sorted.map((entry, index) => {                                                  // map
      const row = document.createElement("tr");
      row.id = `score-row-${index}`;
      row.classList.toggle("mine", entry.name === player.username); // מסמנים את התוצאות שלי

      row.append(
        makeCell(index + 1, "#"),
        makeCell(entry.name, "שם"),
        makeCell(entry.score, "ניקוד"),
        makeCell(LEVEL_LABELS[entry.level] || entry.level, "רמה"),
        makeCell(entry.date, "תאריך")
      );
      scoresBody.appendChild(row);
      return row;
    });
  };
  levelFilter.addEventListener("change", (event) => render(event.target.value));
  render("all");
}
