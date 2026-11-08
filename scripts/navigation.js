document.addEventListener("DOMContentLoaded", () => {
  // =========================================
  // 1. SPA TAB NAVIGATION
  // =========================================

  const navTabs = document.querySelectorAll(".nav-tab, .nav-logo");
  const tabContents = document.querySelectorAll(".tab-content");

  navTabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();

      const targetId = tab.getAttribute("data-target");
      const targetContent = document.getElementById(targetId);

      if (!targetId || !targetContent) return;

      document
        .querySelectorAll(".nav-tab")
        .forEach((item) => item.classList.remove("active"));

      const activeTab = document.querySelector(
        `.nav-tab[data-target="${targetId}"]`,
      );

      if (activeTab) activeTab.classList.add("active");

      tabContents.forEach((content) => {
        content.classList.remove("active");
      });

      targetContent.classList.add("active");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  });
});
