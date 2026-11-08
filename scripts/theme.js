document.addEventListener("DOMContentLoaded", () => {
  // =========================================
  // 2. THEME TOGGLE
  // =========================================

  const themeBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const htmlElement = document.documentElement;

  const savedTheme = localStorage.getItem("vortex_theme") || "dark";

  htmlElement.setAttribute("data-theme", savedTheme);

  if (themeIcon) {
    themeIcon.className =
      savedTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  themeBtn?.addEventListener("click", () => {
    const currentTheme = htmlElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    htmlElement.setAttribute("data-theme", newTheme);

    if (themeIcon) {
      themeIcon.className =
        newTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }

    localStorage.setItem("vortex_theme", newTheme);
  });
});
