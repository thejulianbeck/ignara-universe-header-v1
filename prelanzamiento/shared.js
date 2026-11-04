/* Prelanzamiento: demo email form (no network) + small helpers */
(function () {
  document.querySelectorAll("form[data-demo]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var i = f.querySelector("input[type=email]");
      if (!i.checkValidity()) { i.reportValidity(); return; }
      f.classList.add("is-done");
      var ok = f.parentNode.querySelector(".ok");
      if (ok) { ok.hidden = false; ok.focus && ok.focus(); }
    });
  });
})();
