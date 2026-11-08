document.addEventListener("DOMContentLoaded", () => {
  // =========================================
  // 16. SVG PIE INTERACTIONS
  // =========================================

  const pieSlices = document.querySelectorAll(".pie-slice");
  const tip = document.getElementById("nodeTip");

  pieSlices.forEach((slice) => {
    slice.addEventListener("mouseenter", () => {
      tip.querySelector("strong").textContent =
        slice.getAttribute("data-title");

      tip.querySelector("span").textContent = slice.getAttribute("data-text");

      tip.classList.add("show");
    });

    slice.addEventListener("mousemove", (event) => {
      tip.style.left = `${event.clientX}px`;
      tip.style.top = `${event.clientY - 46}px`;
    });

    slice.addEventListener("mouseleave", () => {
      tip.classList.remove("show");
    });

    slice.addEventListener("click", () => {
      tip.classList.remove("show");

      const target = slice.getAttribute("data-target");

      document.querySelector(`.nav-tab[data-target="${target}"]`)?.click();
    });
  });
});
