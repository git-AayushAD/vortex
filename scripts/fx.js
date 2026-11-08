/* Floating formulas on every tab except #about, plus a glow cursor. No dependencies. */
(() => {
  const formulas = [
    "CaCO\u2083 \u2192 CaO + CO\u2082",
    "C\u2086H\u2081\u2082O\u2086 \u2192 2C\u2082H\u2085OH + 2CO\u2082",
    "6CO\u2082 + 6H\u2082O \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082",
    "NaCl + AgNO\u2083 \u2192 AgCl + NaNO\u2083",
    "N\u2082 + 3H\u2082 \u21CC 2NH\u2083",
    "2H\u2082 + O\u2082 \u2192 2H\u2082O",
    "\u0394H = \u0394U + P\u0394V",
    "E = mc\u00B2",
    "PV = nRT",
    "CH\u2084 + 2O\u2082 \u2192 CO\u2082 + 2H\u2082O",
    "n(C\u2082H\u2084) \u2192 (\u2013CH\u2082\u2013CH\u2082\u2013)n",
    "\u0394G = \u0394H \u2013 T\u0394S",
    "HCl + NaOH \u2192 NaCl + H\u2082O",
    "Re = \u03C1vD / \u03BC",
    "C\u2083H\u2085(OH)\u2083 + 3RCOOH \u2192 Triglyceride",
    "Q = mc\u0394T",
  ];

  /* ---- Floating formulas ---- */
  const layer = document.createElement("div");
  layer.className = "formula-layer";
  layer.setAttribute("aria-hidden", "true");
  formulas.forEach((text, i) => {
    const s = document.createElement("span");
    s.textContent = text;
    const dur = 4 + ((i * 7) % 11) * 1.4;
    s.style.cssText =
      `--x:${((i * 37) % 86) + 3}%;--y:${((i * 53) % 80) + 8}%;` +
      `--s:${(0.85 + ((i * 3) % 5) * 0.12).toFixed(2)}rem;` +
      `--d:${dur}s;--delay:-${((i * 5) % 14) + 1}s;--dx:${(i % 2 ? 1 : -1) * (20 + (i % 4) * 14)}px`;
    layer.appendChild(s);
  });
  document.body.appendChild(layer);

  // Hide on the About tab (the #about section gets .active when shown)
  const about = document.getElementById("about");
  const sync = () =>
    layer.classList.toggle(
      "off",
      !!about && about.classList.contains("active"),
    );
  if (about) {
    new MutationObserver(sync).observe(about, {
      attributes: true,
      attributeFilter: ["class"],
    });
    sync();
  }

  /* ---- Glow cursor ---- */
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.documentElement.classList.add("fx-cursor");
  const dot = document.createElement("div"),
    ring = document.createElement("div");
  dot.className = "fx-dot";
  ring.className = "fx-ring";
  document.body.append(ring, dot);

  let x = 0,
    y = 0,
    rx = 0,
    ry = 0,
    raf = 0;
  const tick = () => {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    raf =
      Math.abs(x - rx) + Math.abs(y - ry) > 0.1
        ? requestAnimationFrame(tick)
        : 0;
  };
  addEventListener(
    "pointermove",
    (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      dot.classList.add("on");
      ring.classList.add("on");
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true },
  );
  addEventListener(
    "pointerover",
    (e) => {
      ring.classList.toggle(
        "hot",
        !!e.target.closest(
          "a, button, .pie-slice, .event-card, .icon-btn, .team-card, [role='button']",
        ),
      );
    },
    { passive: true },
  );
  addEventListener("pointerdown", () => dot.classList.add("down"));
  addEventListener("pointerup", () => dot.classList.remove("down"));
  document.documentElement.addEventListener("mouseleave", () => {
    dot.classList.remove("on");
    ring.classList.remove("on");
  });
})();
