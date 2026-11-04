/* Ignara experiencias: sound (off by default), haptics, demo form */
window.IX = (function () {
  var R = matchMedia("(prefers-reduced-motion: reduce)").matches, ac = null, on = false;
  function ctx() { if (!ac) { var C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); } if (ac && ac.state === "suspended") ac.resume(); return ac; }
  function noise(dur, f, g) { var a = ctx(); if (!a || !on) return; var n = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = n.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2); var s = a.createBufferSource(); s.buffer = n; var bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f || 1800; var gn = a.createGain(); gn.gain.value = g || .4; s.connect(bp).connect(gn).connect(a.destination); s.start(); }
  function tone(fr, dur, g) { var a = ctx(); if (!a || !on) return; var o = a.createOscillator(), gn = a.createGain(); o.type = "sine"; o.frequency.value = fr; gn.gain.setValueAtTime(0, a.currentTime); gn.gain.linearRampToValueAtTime(g || .12, a.currentTime + .02); gn.gain.exponentialRampToValueAtTime(.0001, a.currentTime + dur); o.connect(gn).connect(a.destination); o.start(); o.stop(a.currentTime + dur); }
  var S = {
    crack: function () { noise(.25, 2400, .6); noise(.5, 600, .3); },
    pop: function () { tone(520, .25, .1); },
    whoosh: function () { noise(.6, 900, .25); },
    chime: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tone(f, 1.2, .08); }, i * 120); }); },
    crackle: function () { for (var i = 0; i < 6; i++) setTimeout(function () { noise(.05, 3000 + Math.random() * 2000, .25); }, Math.random() * 600); },
    breath: function (v) { noise(.15, 400, .05 + v * .15); }
  };
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
  function soundBtn() {
    var b = document.createElement("button"); b.className = "snd"; b.type = "button"; b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-label", "Activar sonido"); b.textContent = "🔇";
    b.addEventListener("click", function (e) { e.stopPropagation(); on = !on; if (on) { ctx(); S.pop(); } b.textContent = on ? "🔊" : "🔇"; b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", on ? "Silenciar" : "Activar sonido"); });
    ["pointerdown", "touchstart"].forEach(function (t) { b.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    document.body.appendChild(b);
  }
  function form(root, onOk) {
    var f = root.querySelector("form"), i = f.querySelector("input"), er = f.querySelector(".err"), ok = root.querySelector(".ok");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = i.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { er.textContent = "Revisa tu correo: parece que falta algo."; i.focus(); buzz(30); return; }
      er.textContent = ""; i.blur(); f.classList.add("is-done"); ok.classList.add("on"); buzz([20, 40, 60]); S.chime(); onOk && onOk();
    });
  }
  document.addEventListener("DOMContentLoaded", soundBtn);
  return { R: R, S: S, buzz: buzz, form: form, dpr: Math.min(window.devicePixelRatio || 1, 2) };
})();
