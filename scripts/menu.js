/*
  menu.js
  -------
  מציג ברכה, מאפשר לבחור רמה, ומעביר לדף המשחק
  תוך שימוש ב-query parameter ב-URL:  game.html?level=fast
*/

const menuPlayer = requireLogin();
if (menuPlayer) initMenu(menuPlayer);

function initMenu(player) {
  const greeting = document.getElementById("greeting");
  const levelCards = document.querySelectorAll(".level-card");
  const startBtn = document.getElementById("startBtn");

  greeting.textContent = `שלום, ${player.username}`;

  let selectedLevel = "medium"; // ברירת המחדל מסומנת כבר ב-HTML

  levelCards.forEach((card) => {
    card.addEventListener("click", () => {
      // מסירים את הבחירה מכולם ומסמנים רק את הכרטיס שנלחץ
      levelCards.forEach((c) => {
        c.classList.remove("selected");
        c.setAttribute("aria-pressed", "false");
      });
      card.classList.add("selected");
      card.setAttribute("aria-pressed", "true");
      selectedLevel = card.dataset.level; // קריאת מאפיין data-level
    });
  });

  startBtn.addEventListener("click", () => {
    const params = new URLSearchParams({ level: selectedLevel });
    window.location.href = `game.html?${params.toString()}`;
  });
}
