(function () {
  const header = document.getElementById("site-header");
  const toggle = document.querySelector(".nav-toggle");
  const mobile = document.getElementById("nav-mobile");

  function updateScrolled() {
    const scrolled = window.scrollY > 12;
    header.setAttribute("data-scrolled", scrolled ? "true" : "false");
  }

  updateScrolled();
  window.addEventListener("scroll", updateScrolled, { passive: true });

  if (toggle && mobile) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Abrir menú" : "Cerrar menú");
      mobile.hidden = open;
    });

    mobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menú");
        mobile.hidden = true;
      });
    });
  }
})();
