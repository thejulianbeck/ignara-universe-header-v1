(function () {
  var $ = function (s) { return document.querySelector(s); }, R = IX.R, D = IX.dpr;
  /* ---------- particles ---------- */
  var cv = $("#fx"), cx = cv.getContext("2d"), W, H, P = [], run = false;
  function rs() { W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; cx.setTransform(D, 0, 0, D, 0, 0); }
  rs(); addEventListener("resize", rs);
  function spawn(x, y, n, o) {
    o = o || {}; if (R) n = Math.min(n, 8);
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, s = (o.sp || 4) * (.3 + Math.random());
      P.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 1), g: o.g == null ? .12 : o.g, r: (o.r || 2.4) * (.5 + Math.random()), l: 1, d: (o.d || .018) * (.6 + Math.random() * .8), h: o.h || (20 + Math.random() * 25) }); }
    if (!run) { run = true; requestAnimationFrame(loop); }
  }
  function loop() {
    cx.clearRect(0, 0, W, H); cx.globalCompositeOperation = "lighter";
    for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; p.vx *= .985; p.vy = p.vy * .985 + p.g; p.x += p.vx; p.y += p.vy; p.l -= p.d;
      if (p.l <= 0) { P.splice(i, 1); continue; }
      var r = p.r * (1 + (1 - p.l) * 1.5), g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      g.addColorStop(0, "hsla(" + p.h + ",100%,70%," + p.l + ")"); g.addColorStop(1, "hsla(" + p.h + ",100%,50%,0)");
      cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, r * 3, 0, 6.283); cx.fill(); }
    cx.globalCompositeOperation = "source-over";
    if (P.length) requestAnimationFrame(loop); else { run = false; cx.clearRect(0, 0, W, H); }
  }
  /* ---------- map svg ---------- */
  var pts = [[60, 440], [118, 360], [262, 318], [104, 222], [250, 140], [176, 58]];
  var segs = [], i;
  for (i = 0; i < 5; i++) { var a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2 + (i % 2 ? -50 : 50), my = (a[1] + b[1]) / 2; segs.push("M" + a + " Q" + mx + "," + my + " " + b); }
  function mapSVG(full) {
    var s = '<svg viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' +
      '<linearGradient id="pp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf0d4"/><stop offset="1" stop-color="#efd9a8"/></linearGradient>' +
      '<radialGradient id="vg" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#7a4a14" stop-opacity=".35"/></radialGradient>' +
      '<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="rough"><feTurbulence baseFrequency=".04" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>' +
      (full ? segs.map(function (d, k) { return '<mask id="m' + k + '"><path class="segm" id="sm' + k + '" d="' + d + '" stroke="#fff"/></mask>'; }).join("") : "") +
      '</defs><rect width="360" height="480" fill="url(#pp)"/>' +
      '<g filter="url(#rough)" opacity=".9"><path d="M0 250 C60 230 70 300 140 290 S230 220 300 250 S360 300 360 300 V480 H0Z" fill="#9cc58a" opacity=".55"/>' +
      '<path d="M200 0 C220 60 300 70 360 60 V0Z" fill="#7fb37a" opacity=".6"/><path d="M0 0 H120 C100 50 40 90 0 80Z" fill="#a9cf8e" opacity=".55"/>' +
      '<path d="M-10 160 C60 170 120 120 190 180 S300 250 370 210" fill="none" stroke="#5cc7c0" stroke-width="12" opacity=".75"/>' +
      '<path d="M-10 160 C60 170 120 120 190 180 S300 250 370 210" fill="none" stroke="#bff0e6" stroke-width="3" opacity=".7"/></g>' +
      [[290, 400], [312, 410], [40, 330], [300, 30], [70, 120]].map(function (t) { return '<path d="M' + t[0] + ' ' + t[1] + ' l10 -18 l10 18z" fill="#6c8f4f" opacity=".7"/>'; }).join("") +
      [[30, 210], [48, 200], [220, 380], [236, 392], [320, 120], [150, 410], [330, 330]].map(function (t) { return '<circle cx="' + t[0] + '" cy="' + t[1] + '" r="9" fill="#4f8a4a" opacity=".55"/><circle cx="' + (t[0] - 2) + '" cy="' + (t[1] - 3) + '" r="4" fill="#bfe39a" opacity=".5"/>'; }).join("") +
      '<g transform="translate(312 448)" opacity=".75"><circle r="16" fill="none" stroke="#7a4a14" stroke-width="1"/><path d="M0 -14 L4 0 L0 14 L-4 0Z" fill="#b8431a"/><text y="-19" font-size="8" text-anchor="middle" fill="#7a4a14" font-family="Georgia">N</text></g>' +
      segs.map(function (d, k) { return '<path class="seg" d="' + d + '"' + (full ? ' mask="url(#m' + k + ')"' : ' opacity="0"') + "/>"; }).join("") +
      pts.slice(1).map(function (p, k) { var lock = k === 4; return '<g class="stop" id="' + (full ? "st" + k : "") + '" transform="translate(' + p + ')"><circle r="14" fill="#fbf0d4" stroke="#7a4a14" stroke-width="1.4"/>' +
        (lock ? '<path d="M-5 -1 v-3 a5 5 0 0 1 10 0 v3" fill="none" stroke="#7a4a14" stroke-width="1.8"/><rect x="-7" y="-1" width="14" height="10" rx="2" fill="#7a4a14"/>' : '<circle class="d" r="5" fill="#7a4a14"/>') + "</g>"; }).join("") +
      '<circle cx="60" cy="440" r="6" fill="#b8431a"/><text x="74" y="452" font-family="Georgia" font-style="italic" font-size="12" fill="#7a4a14">Salida</text>' +
      '<text x="18" y="30" font-family="Georgia" font-size="15" letter-spacing="3" fill="#7a4a14">IGNARA · VOL. I</text>' +
      '<rect width="360" height="480" fill="url(#vg)"/></svg>';
    return s;
  }
  /* ---------- seal drag ---------- */
  var env = $("#env"), seal = $("#seal"), crk = $("#crk"), trail = $("#trail"), hint = $("#hint"), st = $("#st"), body = document.body;
  var prog = 0, minX = null, maxX = null, dragging = false, broken = false, lastSp = 0;
  function sealRect() { return seal.getBoundingClientRect(); }
  function setProg(p) { prog = Math.min(1, p); crk.style.strokeDashoffset = 120 * (1 - prog); trail.style.scale = prog + " 1"; seal.style.transform = "translate(-50%,-50%) rotate(" + (Math.sin(prog * 30) * prog * 4) + "deg)"; }
  env.addEventListener("pointerdown", function (e) { if (broken) return; dragging = true; minX = maxX = e.clientX; try { env.setPointerCapture(e.pointerId); } catch (x) {} hint.classList.add("off"); });
  env.addEventListener("pointermove", function (e) {
    if (!dragging || broken) return; var r = sealRect();
    if (e.clientY < r.top - 70 || e.clientY > r.bottom + 70) return;
    minX = Math.min(minX, e.clientX); maxX = Math.max(maxX, e.clientX);
    var a = Math.max(minX, r.left - r.width * .6), b = Math.min(maxX, r.right + r.width * .6);
    var p = Math.max(0, b - a) / (r.width * 1.8); if (p > prog) { setProg(p); var now = performance.now(); if (now - lastSp > 60) { lastSp = now; spawn(e.clientX, e.clientY, 3, { sp: 2, r: 1.6, d: .04 }); IX.buzz(5); IX.S.breath(.2); } }
    if (prog >= 1) breakSeal();
  });
  function up() { dragging = false; if (!broken && prog < 1) { setProg(prog * .6); if (prog < .05) hint.classList.remove("off"); } }
  env.addEventListener("pointerup", up); env.addEventListener("pointercancel", up);
  seal.addEventListener("click", function (e) { if (broken) return; if (e.detail === 0 || R) breakSeal(); else if (prog < .2) { env.animate([{ transform: "rotate(0)" }, { transform: "rotate(-2deg)" }, { transform: "rotate(2deg)" }, { transform: "rotate(0)" }], { duration: 300 }); hint.classList.remove("off"); } });
  /* ---------- sequence ---------- */
  var mapEl = $("#map"), card = $("#card"), tt = $("#t"), kk = $("#k"), nx = $("#nx"), stop = -1, full;
  var texts = ["Cinco amigos,", "un carro,", "un rumor:", "un Libro que cura.", "¿Y si lo que te falta no es algo que se pueda apagar?"];
  function T(ms, f) { setTimeout(f, R ? Math.min(ms, 60) : ms); }
  function breakSeal() {
    if (broken) return; broken = true; dragging = false; setProg(1); var r = sealRect();
    body.classList.add("broken"); IX.S.crack(); IX.buzz([30, 20, 60]);
    spawn(r.left + r.width / 2, r.top + r.height / 2, 70, { sp: 7, r: 2.6, g: .18, d: .016 });
    T(350, function () { env.style.animation = "none"; body.classList.add("open"); IX.S.whoosh(); });
    T(1400, function () { body.classList.add("gone"); mapEl.innerHTML = '<div class="pn p0"><div class="sv">' + mapSVG() + '</div></div><div class="pn p1"><div class="sv">' + mapSVG() + '</div></div><div class="pn p2"><div class="sv">' + mapSVG() + '</div></div><div class="full">' + mapSVG(true) + "</div>"; });
    T(1700, function () { body.classList.add("show"); });
    T(2500, function () { body.classList.add("unf"); IX.S.whoosh(); IX.buzz(15); });
    T(3900, function () {
      full = mapEl.querySelector(".full"); full.classList.add("on"); mapEl.querySelectorAll(".pn").forEach(function (p) { p.style.visibility = "hidden"; });
      for (var k = 0; k < 5; k++) { var m = $("#sm" + k), L = m.getTotalLength(); m.style.setProperty("--L", L); }
      st.style.display = "none"; card.classList.add("in"); go(0);
    });
  }
  function go(n) {
    stop = n; var m = $("#sm" + n); requestAnimationFrame(function () { m.classList.add("on"); });
    T(R ? 0 : 900, function () { var s = $("#st" + n); s.classList.add("on"); var b = s.getBoundingClientRect(); spawn(b.left + b.width / 2, b.top + b.height / 2, 14, { sp: 2.2, r: 1.8, g: -.02, d: .02 }); IX.S.pop(); IX.buzz(10); });
    kk.textContent = n < 4 ? "Parada " + (n + 1) + " de 5" : "Parada 5 · El candado";
    scramble(tt, texts[n]);
    if (n === 4) { card.classList.add("lock"); kk.textContent = "Parada 5 · Guarda tu lugar en el viaje"; }
    nx.textContent = n === 3 ? "Última parada →" : "Siguiente parada →";
  }
  nx.addEventListener("click", function () { if (stop < 4) go(stop + 1); });
  function scramble(el, t) { if (R) { el.textContent = t; return; } var G = "abcdefghijklmnñopqrstuvwxyz", st0 = performance.now(), d = 500 + t.length * 18;
    (function f(now) { var p = Math.min(1, (now - st0) / d), c = Math.floor(p * t.length), o = ""; for (var i = 0; i < t.length; i++) o += i < c || t[i] === " " ? t[i] : G[(Math.random() * G.length) | 0]; el.textContent = o; if (p < 1) requestAnimationFrame(f); })(st0); }
  /* ---------- form + ignite ---------- */
  IX.form($("#fm"), function () {
    tt.textContent = "Tu ruta está encendida."; kk.textContent = "Lugar guardado";
    full.querySelector("svg").classList.add("lit"); IX.S.crackle();
    var svg = full.querySelector("svg"), ctm = svg.getScreenCTM(), paths = svg.querySelectorAll(".seg"), t0 = performance.now(), dur = R ? 1 : 2600;
    (function burn(now) { var p = Math.min(1, (now - t0) / dur), tot = 0, L = [];
      paths.forEach(function (q) { var l = q.getTotalLength(); L.push(l); tot += l; });
      var at = p * tot, k = 0; while (k < L.length - 1 && at > L[k]) { at -= L[k]; k++; }
      var pt = paths[k].getPointAtLength(Math.min(at, L[k])), x = pt.x * ctm.a + ctm.e, y = pt.y * ctm.d + ctm.f;
      spawn(x, y, R ? 2 : 4, { sp: 1.4, r: 2, g: -.06, d: .014, up: .6 });
      if (p < 1) requestAnimationFrame(burn); else pts.slice(1).forEach(function (q) { spawn(q[0] * ctm.a + ctm.e, q[1] * ctm.d + ctm.f, 18, { sp: 2.5, g: -.04 }); });
    })(t0);
  });
  window.__sello = { breakSeal: breakSeal };
})();
