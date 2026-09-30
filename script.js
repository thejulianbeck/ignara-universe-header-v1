(function () {
  /**
   * Glyph set remede of followingwildfire txt-shuffle charset (not copied code).
   * Scramble cadence remedes their SHOW animation:
   *   blank (spaces) → random noise glyphs → resolve left→right,
   * with a delayResolve gap so noise leads the settle wave.
   *
   * data-delay  = start offset in seconds BEFORE the animation begins (stagger)
   * data-duration = animation length in seconds
   * Internal revealDelay stays ~0 so the resolve wave always completes.
   */
  const GLYPHS =
    " !#$&%()*+0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";

  const hub = document.getElementById("view-hub");
  const book = document.getElementById("view-book");
  const loader = document.getElementById("loader");
  const loaderIcon = document.getElementById("loader-icon");
  const loaderText = document.getElementById("loader-text");
  const loaderPct = document.getElementById("loader-pct");
  const enterBtn = document.getElementById("enter-book-2");
  const footerEnter = document.getElementById("footer-enter-2");
  const backBtn = document.getElementById("back-hub");
  const brandHome = document.getElementById("brand-home");
  const headerMeta = document.getElementById("header-meta");
  const header = document.getElementById("site-header");
  const bookActions = document.getElementById("book-actions");
  const navToggle = document.getElementById("nav-toggle");
  const headerNav = document.getElementById("header-nav");
  const body = document.body;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Frosted glass: visible on scroll; forced on book view ——
     Theme-nav flips ink/cream so glass stays readable on cream OR night bands. */
  function updateGlass() {
    const scrolled = window.scrollY > 12;
    header.setAttribute("data-scrolled", scrolled ? "true" : "false");
  }

  function setForceGlass(on) {
    header.setAttribute("data-force-glass", on ? "true" : "false");
  }

  function setThemeNav(theme) {
    header.setAttribute("data-theme-nav", theme === "dark" ? "dark" : "light");
  }

  function sampleNavTheme() {
    if (body.dataset.view === "book") {
      setThemeNav("dark");
      return;
    }
    const probeY = Math.min(header.getBoundingClientRect().bottom + 8, window.innerHeight * 0.2);
    const sections = hub.querySelectorAll("[data-theme-section]");
    let theme = "light";
    sections.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top <= probeY && r.bottom > probeY) {
        theme = el.getAttribute("data-theme-section") === "dark" ? "dark" : "light";
      }
    });
    setThemeNav(theme);
  }

  function setMenu(open) {
    body.dataset.menu = open ? "open" : "closed";
    if (navToggle) navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (navToggle) {
      navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    }
  }

  updateGlass();
  sampleNavTheme();
  window.addEventListener(
    "scroll",
    () => {
      updateGlass();
      sampleNavTheme();
    },
    { passive: true }
  );
  window.addEventListener("resize", sampleNavTheme, { passive: true });

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      setMenu(body.dataset.menu !== "open");
    });
  }

  if (headerNav) {
    headerNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
  }

  function setView(name) {
    body.dataset.view = name;
    hub.hidden = name !== "hub";
    book.hidden = name !== "book";
    headerMeta.textContent = name === "book" ? "ignara dos" : "hub";
    var labForce = document.getElementById("lab-force-glass");
    /* Sticky header is hidden on book; only force glass on hub lab toggle */
    setForceGlass(name === "hub" && labForce && labForce.checked);
    setMenu(false);
    updateGlass();
    sampleNavTheme();
  }

  function randomGlyph() {
    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  function quartOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function quadInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function readFinal(el) {
    const raw = el.getAttribute("data-final") || el.dataset.final || el.dataset.finalText || "";
    const cleaned = String(raw).replace(/\s+/g, " ").trim();
    if (cleaned) {
      el.setAttribute("data-final", cleaned);
      el.dataset.final = cleaned;
      return cleaned;
    }
    return "";
  }

  function commitFinal(el, finalText) {
    el.textContent = finalText;
    el.classList.add("is-resolved");
    el.style.opacity = "1";
    el.style.visibility = "visible";
    el.style.color = "";
  }

  /**
   * Blank → noise → resolve (followingwildfire txt-shuffle SHOW remede).
   */
  function scrambleText(el, options) {
    const opts = Object.assign(
      {
        duration: 1.4,
        startDelay: 0,
        revealDelay: 0,
        delayResolve: 0.22,
        fps: 24,
      },
      options || {}
    );

    const finalText = readFinal(el);
    if (!finalText) {
      el.textContent = "";
      return Promise.resolve();
    }

    el.textContent = "";
    el.classList.remove("is-resolved");

    if (reduceMotion) {
      commitFinal(el, finalText);
      return Promise.resolve();
    }

    const durationMs = Math.max(200, opts.duration * 1000);
    const startDelayMs = Math.max(0, opts.startDelay * 1000);
    const revealDelay = clamp01(Math.min(opts.revealDelay, 0.15));
    const delayResolve = clamp01(Math.min(opts.delayResolve, 0.35));

    return new Promise((resolve) => {
      let raf = 0;
      let settled = false;

      function finish() {
        if (settled) return;
        settled = true;
        if (raf) cancelAnimationFrame(raf);
        commitFinal(el, finalText);
        resolve();
      }

      const safety = window.setTimeout(finish, startDelayMs + durationMs + 400);

      window.setTimeout(() => {
        const chars = finalText.split("");
        const order = chars.map((_, i) => i);
        const frameMs = 1000 / opts.fps;
        const start = performance.now();
        let lastPaint = 0;

        function paint(c) {
          const hRaw = clamp01(c - revealDelay);
          const h = quartOut(hRaw);
          const fRaw = clamp01(c - revealDelay - delayResolve);
          const denom = Math.max(0.01, 1 - delayResolve);
          const f = quadInOut((1 / denom) * fRaw);

          const revealCount = Math.round(h * chars.length);
          const resolveCount = Math.round(f * chars.length);

          let out = "";
          for (let i = 0; i < chars.length; i++) {
            const rank = order[i];
            let ch = chars[i];
            if (rank >= revealCount) {
              ch = " ";
            } else if (ch !== " " && rank >= resolveCount) {
              ch = randomGlyph();
            }
            out += ch;
          }
          el.textContent = out;
        }

        function tick(now) {
          if (settled) return;
          if (now - lastPaint < frameMs && now - start < durationMs) {
            raf = requestAnimationFrame(tick);
            return;
          }
          lastPaint = now;
          const c = Math.min(1, (now - start) / durationMs);
          paint(c);
          if (c < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            window.clearTimeout(safety);
            finish();
          }
        }

        paint(0);
        raf = requestAnimationFrame(tick);
      }, startDelayMs);
    });
  }

  function prepareBookBlank() {
    book.classList.add("is-blank");
    book.querySelectorAll("[data-scramble]").forEach((node) => {
      readFinal(node);
      node.textContent = "";
      node.classList.remove("is-resolved");
      node.style.opacity = "";
      node.style.visibility = "";
      node.style.color = "";
    });
    if (bookActions) {
      bookActions.classList.add("is-deferred");
      bookActions.classList.remove("is-ready");
    }
  }

  function forceAllFinals() {
    book.querySelectorAll("[data-scramble]").forEach((node) => {
      const finalText = readFinal(node);
      if (finalText) commitFinal(node, finalText);
    });
  }

  function scrambleAllInBook() {
    const nodes = Array.from(book.querySelectorAll("[data-scramble]"));
    nodes.forEach((node) => {
      if (!readFinal(node)) {
        console.warn("[ignara] scramble node missing data-final", node);
      }
    });

    const jobs = nodes.map((node) => {
      const startDelay = Number(node.dataset.delay || 0);
      const duration = Number(node.dataset.duration || 1.4);
      return scrambleText(node, {
        startDelay,
        duration,
        revealDelay: 0,
        delayResolve: 0.22,
      });
    });

    return Promise.all(jobs)
      .catch((err) => {
        console.warn("[ignara] scramble failed, forcing finals", err);
        forceAllFinals();
      })
      .then(() => {
        nodes.forEach((node) => {
          const finalText = readFinal(node);
          if (finalText && !node.textContent.trim()) {
            commitFinal(node, finalText);
          }
        });
        book.classList.remove("is-blank");
        if (bookActions) {
          bookActions.classList.remove("is-deferred");
          bookActions.classList.add("is-ready");
        }
      });
  }

  /* —— Real-ish loading: weighted Promise stages + min dwell ——
   * Weights:
   *   fonts          40%  — IBM Plex Mono + Inter via document.fonts
   *   stylesheet/css 20%  — styles.css fetch (cache-aware)
   *   glyph buffer   15%  — build scramble charset / seed strings
   *   init view      15%  — blank book nodes + prepare scramble finals
   *   min dwell      10%  — floor so the ritual never flashes
   * UI shows ONLY Loading_ignara_dos_ + percentage (no stage labels).
   */
  const LOAD_WEIGHTS = {
    fonts: 40,
    assets: 20,
    glyphs: 15,
    init: 15,
    dwell: 10,
  };

  function easeDisplay(current, target) {
    const delta = target - current;
    if (Math.abs(delta) < 0.35) return target;
    return current + delta * 0.18;
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function loadFonts() {
    if (!document.fonts || !document.fonts.load) {
      return wait(180);
    }
    return Promise.all([
      document.fonts.load('400 1em "IBM Plex Mono"'),
      document.fonts.load('500 1em "IBM Plex Mono"'),
      document.fonts.load('600 1em "IBM Plex Mono"'),
      document.fonts.load('700 1em "IBM Plex Mono"'),
      document.fonts.load('400 1em "Inter"'),
      document.fonts.load('500 1em "Inter"'),
      document.fonts.load('600 1em "Inter"'),
      document.fonts.ready,
    ]).then(() => wait(40));
  }

  function loadStylesheet() {
    const href = new URL("styles.css", window.location.href).href;
    return fetch(href, { cache: "force-cache" })
      .then((res) => (res.ok ? res.text() : ""))
      .then(() => wait(30))
      .catch(() => wait(80));
  }

  function decodeGlyphBuffer() {
    return new Promise((resolve) => {
      const pool = [];
      const rounds = 48;
      let i = 0;
      function step() {
        const batch = 64;
        for (let n = 0; n < batch; n++) {
          pool.push(randomGlyph());
        }
        i += 1;
        if (i < rounds) {
          requestAnimationFrame(step);
        } else {
          window.__ignaraGlyphPool = pool;
          resolve();
        }
      }
      step();
    });
  }

  function initBookView() {
    prepareBookBlank();
    book.querySelectorAll("[data-scramble]").forEach((n) => {
      readFinal(n);
      void n.offsetHeight;
    });
    return wait(60);
  }

  function runLoader() {
    return new Promise((resolve) => {
      loader.hidden = false;
      loader.classList.remove("is-leaving");
      loader.classList.add("is-on");
      loaderIcon.classList.add("is-glitch");
      loaderText.textContent = "Loading_ignara_dos_";
      loaderPct.textContent = "0%_";

      loaderText.setAttribute("data-final", "Loading_ignara_dos_");
      scrambleText(loaderText, {
        duration: reduceMotion ? 0.05 : 0.9,
        startDelay: 0,
        revealDelay: 0,
        delayResolve: 0.2,
        fps: 20,
      });

      const progress = { fonts: 0, assets: 0, glyphs: 0, init: 0, dwell: 0 };
      let displayPct = 0;
      let finished = false;
      const startedAt = performance.now();
      const MIN_MS = reduceMotion ? 200 : 1300;
      const MAX_MS = reduceMotion ? 600 : 2600;

      function weightedTotal() {
        return (
          (progress.fonts * LOAD_WEIGHTS.fonts +
            progress.assets * LOAD_WEIGHTS.assets +
            progress.glyphs * LOAD_WEIGHTS.glyphs +
            progress.init * LOAD_WEIGHTS.init +
            progress.dwell * LOAD_WEIGHTS.dwell) /
          100
        );
      }

      function paintPct() {
        const target = Math.min(100, weightedTotal() * 100);
        displayPct = easeDisplay(displayPct, target);
        const shown = Math.floor(displayPct);
        loaderPct.textContent = shown + "%_";
        if (!finished) requestAnimationFrame(paintPct);
      }
      requestAnimationFrame(paintPct);

      (async () => {
        await Promise.all([
          loadFonts().then(() => {
            progress.fonts = 1;
          }),
          loadStylesheet().then(() => {
            progress.assets = 1;
          }),
        ]);
        await decodeGlyphBuffer().then(() => {
          progress.glyphs = 1;
        });
        await initBookView().then(() => {
          progress.init = 1;
        });

        const elapsed = performance.now() - startedAt;
        const dwellNeed = Math.max(0, MIN_MS - elapsed);
        const dwellStart = performance.now();
        const dwellTarget = Math.max(dwellNeed, reduceMotion ? 0 : 220);
        while (performance.now() - dwellStart < dwellTarget) {
          const t = clamp01((performance.now() - dwellStart) / dwellTarget);
          progress.dwell = t;
          await wait(32);
        }
        progress.dwell = 1;

        const totalElapsed = performance.now() - startedAt;
        if (totalElapsed > MAX_MS) {
          Object.keys(progress).forEach((k) => {
            progress[k] = 1;
          });
        }

        displayPct = 100;
        loaderPct.textContent = "100%_";
        loaderIcon.classList.remove("is-glitch");
        finished = true;

        await wait(reduceMotion ? 0 : 280);
        loader.classList.add("is-leaving");
        await wait(reduceMotion ? 0 : 350);
        loader.hidden = true;
        loader.classList.remove("is-on", "is-leaving");
        resolve();
      })();
    });
  }

  async function enterBook2() {
    if (enterBtn) enterBtn.disabled = true;
    if (footerEnter) footerEnter.disabled = true;
    prepareBookBlank();
    await runLoader();
    setView("book");
    window.scrollTo(0, 0);
    try {
      await scrambleAllInBook();
    } catch (err) {
      console.warn("[ignara] enterBook2 scramble error", err);
      forceAllFinals();
      book.classList.remove("is-blank");
      if (bookActions) {
        bookActions.classList.remove("is-deferred");
        bookActions.classList.add("is-ready");
      }
    }
    window.setTimeout(() => {
      const empty = Array.from(book.querySelectorAll("[data-scramble]")).filter(
        (n) => !n.textContent.trim() && readFinal(n)
      );
      if (empty.length) {
        forceAllFinals();
        book.classList.remove("is-blank");
      }
    }, 100);
    if (enterBtn) enterBtn.disabled = false;
    if (footerEnter) footerEnter.disabled = false;
  }

  function goHub() {
    prepareBookBlank();
    setView("hub");
    window.scrollTo(0, 0);
  }

  if (enterBtn) enterBtn.addEventListener("click", enterBook2);
  if (footerEnter) footerEnter.addEventListener("click", enterBook2);
  if (backBtn) backBtn.addEventListener("click", goHub);

  brandHome.addEventListener("click", (e) => {
    e.preventDefault();
    if (body.dataset.view !== "hub") {
      goHub();
    } else {
      setMenu(false);
      const top = document.getElementById("inicio");
      if (top) top.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      else window.scrollTo(0, 0);
    }
  });


  /* —— Live glass lab: Glass Lab Lock vars → :root (+ preview + sticky header) ——
     New storage key so old ignara-glass-lab-v1 values cannot clobber Lock defaults. */
  (function initGlassLab() {
    const panel = document.getElementById("glass-lab");
    if (!panel) return;

    const STORAGE_KEY = "ignara-glass-lab-lock-v2";
    const LEGACY_KEYS = ["ignara-glass-lab-v1"];
    const root = document.documentElement;
    const previewBar = document.getElementById("lab-preview-bar");

    /* Locked defaults from Glass Lab (Julián screenshots / Lock preset) */
    const DEFAULTS = {
      "--glass-opacity": { value: 0.15, unit: "" },
      "--glass-blur": { value: 10, unit: "px" },
      "--glass-saturate": { value: 1.15, unit: "" },
      "--glass-brightness": { value: 1.1, unit: "" },
      "--glass-contrast": { value: 1.05, unit: "" },
      "--glass-border-opacity": { value: 0.35, unit: "" },
      "--glass-border-width": { value: 0.25, unit: "px" },
      "--glass-specular": { value: 0, unit: "" },
      "--glass-noise": { value: 0.12, unit: "" },
      "--glass-radius": { value: 20, unit: "px" },
      "--glass-inner-shadow": { value: 0.2, unit: "" },
      "--glass-outer-shadow": { value: 0, unit: "" },
    };

    const inputs = Array.from(panel.querySelectorAll("input[data-glass-var]"));
    const forceToggle = document.getElementById("lab-force-glass");
    const copyBtn = document.getElementById("lab-copy");
    const resetBtn = document.getElementById("lab-reset");
    const statusEl = document.getElementById("lab-status");
    let statusTimer = 0;

    try {
      LEGACY_KEYS.forEach(function (k) {
        localStorage.removeItem(k);
      });
    } catch (err) {
      /* ignore */
    }

    function formatValue(raw, unit, step) {
      const n = Number(raw);
      if (!Number.isFinite(n)) return String(raw) + unit;
      const decimals = String(step || "").includes(".")
        ? (String(step).split(".")[1] || "").length
        : Number.isInteger(n)
          ? 0
          : 2;
      const shown = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
      return shown + unit;
    }

    function setStatus(msg) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      window.clearTimeout(statusTimer);
      if (msg) {
        statusTimer = window.setTimeout(function () {
          statusEl.textContent = "";
        }, 2400);
      }
    }

    function applyInput(input, persist) {
      const cssVar = input.getAttribute("data-glass-var");
      if (!cssVar) return;
      const unit = input.getAttribute("data-unit") || "";
      const cssValue = formatValue(input.value, unit, input.step);
      root.style.setProperty(cssVar, cssValue);
      if (previewBar) previewBar.style.setProperty(cssVar, cssValue);
      const valueEl = panel.querySelector('[data-glass-value][data-for="' + input.id + '"]');
      if (valueEl) {
        valueEl.textContent = cssValue;
        valueEl.setAttribute("data-pulse", "1");
        window.requestAnimationFrame(function () {
          valueEl.removeAttribute("data-pulse");
        });
      }
      if (persist !== false) saveState();
    }

    function readState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (err) {
        return null;
      }
    }

    function currentSnapshot() {
      const vars = {};
      inputs.forEach(function (input) {
        const cssVar = input.getAttribute("data-glass-var");
        const unit = input.getAttribute("data-unit") || "";
        vars[cssVar] = formatValue(input.value, unit, input.step);
      });
      return {
        vars: vars,
        forceGlass: !!(forceToggle && forceToggle.checked),
      };
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSnapshot()));
      } catch (err) {
        /* private mode / quota — ignore */
      }
    }

    function applyForceGlass() {
      if (!forceToggle) return;
      setForceGlass(forceToggle.checked);
    }

    function loadState() {
      const saved = readState();
      if (!saved || !saved.vars) return;
      inputs.forEach(function (input) {
        const cssVar = input.getAttribute("data-glass-var");
        const unit = input.getAttribute("data-unit") || "";
        let stored = saved.vars[cssVar];
        if (stored == null) return;
        const numeric = String(stored).replace(unit, "").trim();
        if (numeric === "" || Number.isNaN(Number(numeric))) return;
        input.value = numeric;
        applyInput(input, false);
      });
      if (forceToggle && typeof saved.forceGlass === "boolean") {
        forceToggle.checked = saved.forceGlass;
      }
    }

    function resetDefaults() {
      inputs.forEach(function (input) {
        const cssVar = input.getAttribute("data-glass-var");
        const def = DEFAULTS[cssVar];
        if (!def) return;
        input.value = String(def.value);
        applyInput(input, false);
      });
      if (forceToggle) forceToggle.checked = true;
      applyForceGlass();
      saveState();
      setStatus("Lock restablecido");
    }

    function buildCssSnippet(vars) {
      const lines = Object.keys(vars).map(function (k) {
        return "  " + k + ": " + vars[k] + ";";
      });
      return ":root {\n" + lines.join("\n") + "\n}";
    }

    async function copyValues() {
      const snap = currentSnapshot();
      const payload =
        buildCssSnippet(snap.vars) +
        "\n\n" +
        JSON.stringify(snap.vars, null, 2);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(payload);
        } else {
          const ta = document.createElement("textarea");
          ta.value = payload;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setStatus("Valores copiados");
      } catch (err) {
        setStatus("No se pudo copiar — selecciónalos a mano");
        console.warn("[ignara] copy failed", err);
      }
    }

    /* First paint: apply Lock HTML defaults (CSS preset already on :root).
       Then optionally overlay v2 storage — never the legacy key. */
    inputs.forEach(function (input) {
      applyInput(input, false);
      input.addEventListener("input", function () { applyInput(input, true); });
      input.addEventListener("change", function () { applyInput(input, true); });
    });

    panel.addEventListener("input", function (ev) {
      const t = ev.target;
      if (t && t.matches && t.matches("input[data-glass-var]")) {
        applyInput(t, true);
      }
    });

    if (forceToggle) {
      forceToggle.addEventListener("change", function () {
        applyForceGlass();
        saveState();
      });
    }

    if (copyBtn) copyBtn.addEventListener("click", copyValues);
    if (resetBtn) resetBtn.addEventListener("click", resetDefaults);

    loadState();
    applyForceGlass();
  })();


  prepareBookBlank();
  setView("hub");
  setMenu(false);
})();
