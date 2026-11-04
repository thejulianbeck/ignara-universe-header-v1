(function () {
  var IX = window.IX, gb = document.getElementById("gb"), lid = document.getElementById("lid"), hint = document.getElementById("hint"),
    cnt = document.getElementById("cnt"), sheet = document.getElementById("sheet");
  var W, H, bodies = [], idx = 0, opened = false, raf = 0;
  var sil = '<svg viewBox="0 0 150 120" fill="#2a1d14">' + [18, 44, 72, 100, 126].map(function (x, i) {
    var h = [62, 70, 66, 74, 60][i]; return '<circle cx="' + x + '" cy="' + (120 - h) + '" r="9"/><path d="M' + (x - 13) + ' 120q0-' + (h - 18) + ' 13-' + (h - 16) + 'q13 2 13 ' + (h - 16) + 'z"/>';
  }).join("") + "</svg>";
  var defs = [
    { c: "photo", h: '<div class="im">' + sil + '</div><p>los cinco · antes de salir</p>', lab: "Una foto" },
    { c: "ticket", h: 'Boleto de tren<b>IDA</b>Pasajeros: 5 · Vagón 3<i>Nº 0005</i>', lab: "Un boleto" },
    { c: "note", h: 'Cinco amigos, un carro, un rumor: un Libro que cura.<small>¿Y si lo que te falta no es algo que se pueda apagar?</small>', lab: "Una nota" },
    { c: "box", h: '<svg viewBox="0 0 24 24" fill="none" stroke="#ffe9b0" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2" fill="#5a3216"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>', lab: "Una cajita cerrada" }
  ];
  function size() { W = innerWidth; H = innerHeight; }
  size(); addEventListener("resize", size);
  function gbRect() { return gb.getBoundingClientRect(); }

  function spawn() {
    if (idx >= defs.length) return;
    var d = defs[idx++], el = document.createElement("div");
    el.className = "obj " + d.c; el.innerHTML = d.h; el.setAttribute("role", "img"); el.setAttribute("aria-label", d.lab);
    document.body.appendChild(el);
    var r = gbRect(), w = el.offsetWidth, h = el.offsetHeight;
    var b = { el: el, w: w, h: h, x: r.left + r.width / 2 - w / 2, y: r.top + r.height * .3 - h / 2, vx: (Math.random() - .5) * 6, vy: -16 - Math.random() * 3, a: (Math.random() - .5) * 20, va: (Math.random() - .5) * 8, drag: false, box: d.c === "box", moved: 0, rr: Math.random() * 16 - 8 };
    if (IX.R) { b.vx = 0; b.vy = 0; b.x = 20 + (idx - 1) * (W - w - 40) / 3; b.y = H * .14 + (idx - 1) * 30; }
    bodies.push(b); bind(b); IX.S.pop(); IX.buzz(12);
    cnt.textContent = d.lab + " · " + idx + " de 4";
    hint.textContent = b.box ? "Toca la cajita para abrirla" : "Arrastra o lanza el objeto · toca la guantera para sacar otro";
    hint.classList.remove("off");
    if (b.box) gb.style.pointerEvents = "none";
    if (!raf) loop();
  }
  function bind(b) {
    var px, py, lt, lx, ly;
    b.el.addEventListener("pointerdown", function (e) {
      b.drag = true; b.moved = 0; b.el.classList.add("drag"); b.el.setPointerCapture(e.pointerId);
      px = e.clientX - b.x; py = e.clientY - b.y; lx = e.clientX; ly = e.clientY; lt = performance.now(); b.vx = b.vy = 0;
      bodies.splice(bodies.indexOf(b), 1); bodies.push(b); bodies.forEach(function (o, i) { o.el.style.zIndex = 5 + i; });
    });
    b.el.addEventListener("pointermove", function (e) {
      if (!b.drag) return; var t = performance.now(), dt = Math.max(8, t - lt);
      b.vx = (e.clientX - lx) / dt * 16; b.vy = (e.clientY - ly) / dt * 16; b.moved += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
      lx = e.clientX; ly = e.clientY; lt = t; b.x = e.clientX - px; b.y = e.clientY - py; b.va = b.vx * .4;
    });
    function up() { if (!b.drag) return; b.drag = false; b.el.classList.remove("drag"); if (b.moved > 30) IX.S.whoosh(); else if (b.box) openSheet(); }
    b.el.addEventListener("pointerup", up); b.el.addEventListener("pointercancel", up);
    b.el.tabIndex = 0;
    b.el.addEventListener("keydown", function (e) { if (b.box && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openSheet(); } });
  }
  function loop() {
    var floor = H - 20;
    bodies.forEach(function (b) {
      if (!b.drag && !IX.R) {
        b.vy += .7; b.vx *= .985; b.va *= .96; b.x += b.vx; b.y += b.vy; b.a += b.va;
        if (b.y + b.h > floor) { b.y = floor - b.h; if (b.vy > 3) IX.buzz(8); b.vy *= -.35; b.vx *= .8; b.va = b.vx * .5; }
        if (b.x < 0) { b.x = 0; b.vx *= -.6; } if (b.x + b.w > W) { b.x = W - b.w; b.vx *= -.6; }
        if (b.y < -b.h * .5) { b.y = -b.h * .5; b.vy = 0; }
        if (Math.abs(b.vy) < .8 && b.y + b.h >= floor - 1) b.a += (Math.round(b.a / 360) * 360 + (b.box ? 0 : b.rr) - b.a) * .08;
      }
      b.el.style.transform = "translate3d(" + b.x + "px," + b.y + "px,0) rotate(" + b.a + "deg)";
    });
    raf = requestAnimationFrame(loop);
  }
  function openLid() {
    if (!opened) { opened = true; document.body.classList.add("opened"); lid.setAttribute("aria-label", "Sacar el siguiente objeto"); IX.S.crack(); IX.buzz(20); setTimeout(spawn, IX.R ? 0 : 450); return; }
    spawn();
  }
  lid.addEventListener("click", openLid);
  gb.addEventListener("click", function (e) { if (opened && e.target !== lid && !lid.contains(e.target)) spawn(); });
  function openSheet() { sheet.classList.add("in"); hint.classList.add("off"); setTimeout(function () { var i = sheet.querySelector("input"); i && i.focus({ preventScroll: true }); }, 500); }
  IX.form(document.getElementById("fm"), function () {
    var b = bodies.filter(function (o) { return o.box; })[0]; if (b) b.el.classList.add("open");
    sheet.querySelector(".k").textContent = "Cajita abierta"; sheet.querySelector("h2").textContent = "Dentro hay un mapa doblado: el del viaje.";
    cnt.textContent = "Lugar guardado";
  });
  window.__g = { open: openLid, bodies: bodies, openSheet: openSheet };
})();
