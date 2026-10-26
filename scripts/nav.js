/*
  nav.js
  ------
  בונה את סרגל הניווט העליון בכל הדפים המוגנים (במקום להעתיק אותו לכל דף).
  במסך רחב: קישורים בשורה. במסך צר (מובייל): כפתור המבורגר שפותח תפריט נפתח.
  הקובץ בונה את הסרגל לבד כשיש בדף אלמנט עם id="navRoot".
*/
const buildNav = (root, player) => {
  const isAdmin = player.role === "admin";
  const links = isAdmin
    ? [["admin.html", "ניהול"], ["leaderboard.html", "שיאים"]]
    : [["menu.html", "תפריט"], ["instructions.html", "הוראות"], ["leaderboard.html", "שיאים"]];
  const currentPage = window.location.pathname.split("/").pop();

  const header = document.createElement("header");
  header.className = "topbar";

  const brand = document.createElement("a");
  brand.className = "brand";
  brand.href = isAdmin ? "admin.html" : "menu.html";
  const logo = document.createElement("img");
  logo.className = "brand-logo";
  logo.src = "../images/logo-nav.png";
  logo.alt = "";
  const brandName = document.createElement("span");
  brandName.textContent = "Go Stone";
  brand.append(logo, brandName);

  // כפתור ההמבורגר - מוצג ב-CSS רק במסך צר
  const burger = document.createElement("button");
  burger.type = "button";
  burger.className = "burger";
  burger.setAttribute("aria-label", "פתיחת תפריט");
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-controls", "navLinks");
  burger.innerHTML = "<span></span><span></span><span></span>";

  const nav = document.createElement("nav");
  nav.id = "navLinks";
  nav.className = "nav-links";

  links.forEach(([href, label]) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    a.classList.toggle("active", href === currentPage);
    nav.appendChild(a);
  });

  const who = document.createElement("span");
  who.className = "nav-user";
  who.textContent = player.username;

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "btn tonal small";
  logoutBtn.textContent = "התנתקות";
  logoutBtn.addEventListener("click", () => {
    clearCurrentPlayer();
    window.location.href = "../index.html";
  });

  nav.append(who, logoutBtn);
  header.append(brand, burger, nav);
  root.appendChild(header);

  // פתיחה/סגירה של התפריט הנפתח
  const setOpen = (open) => {
    nav.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  };

  burger.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setOpen(false); // לחיצה מחוץ לסרגל סוגרת
  });
  window.addEventListener("resize", () => setOpen(false));
};

const navRoot = document.getElementById("navRoot");
if (navRoot) {
  const navPlayer = requireLogin();
  if (navPlayer) buildNav(navRoot, navPlayer);
}
