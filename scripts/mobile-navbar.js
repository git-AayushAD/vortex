document.addEventListener("DOMContentLoaded", () => {
  // =========================================
  // 17. MOBILE MENU
  // =========================================

  const cartSidebar = document.getElementById("cartSidebar");
  const menuBtn = document.getElementById("menuToggleBtn");
  const navLinksEl = document.querySelector(".nav-links");

  const closeMenu = () => {
    menuBtn?.classList.remove("open");
    navLinksEl?.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  };

  menuBtn?.addEventListener("click", () => {
    const isOpen = navLinksEl.classList.toggle("open");

    menuBtn.classList.toggle("open", isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) cartSidebar?.classList.remove("active");
  });

  cartToggleBtn?.addEventListener("click", closeMenu);

  navLinksEl?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.querySelector(".nav-logo")?.addEventListener("click", closeMenu);

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".navbar")) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMenu();
  });

  // =========================================
  // 18. NAVBAR SCROLL BEHAVIOUR
  // =========================================

  const navbarEl = document.querySelector(".navbar");

  let lastScrollY = window.scrollY;
  let scrollTicking = false;

  const handleNavbarScroll = () => {
    const currentY = Math.max(window.scrollY, 0);
    const delta = currentY - lastScrollY;

    if (Math.abs(delta) > 8) {
      const menuOpen = navLinksEl?.classList.contains("open");

      if (delta > 0 && currentY > navbarEl.offsetHeight && !menuOpen) {
        navbarEl.classList.add("nav-hidden");
        document.body.classList.add("nav-is-hidden");
      } else if (delta < 0) {
        navbarEl.classList.remove("nav-hidden");
        document.body.classList.remove("nav-is-hidden");
      }

      lastScrollY = currentY;
    }

    if (currentY <= 0) {
      navbarEl.classList.remove("nav-hidden");
      document.body.classList.remove("nav-is-hidden");
    }

    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        requestAnimationFrame(handleNavbarScroll);
        scrollTicking = true;
      }
    },
    { passive: true },
  );
});
