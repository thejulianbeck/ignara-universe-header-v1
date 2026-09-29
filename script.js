(function () {
  /**
   * Glyph set remede of followingwildfire txt-shuffle charset (not copied code).
   * Scramble cadence remedes their SHOW animation:
   *   blank (spaces) → random noise glyphs → resolve left→right,
   * with a delayResolve gap so noise leads the settle wave.
   */
  const GLYPHS =
    " !#$&%()*+0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";

  const hub = document.getElementById("view-hub");
  const book = document.getElementById("view-book");
  const loader = document.getElementById("loader");
  const loaderIcon = document.getElementById("loader-icon");
  const loaderText = document.getElementById("loader-text");
  const loaderPct = document.getElementById("loader-pct");
  const loaderStage = document.getElementById("loader-stage");
  const enterBtn = document.getElementById("enter-book-2");
  const backBtn = document.getElementById("back-hub");
  const brandHome = document.getElementById("brand-home");
  const headerMeta = document.getElementById("header-meta");
  const header = document.getElementById("site-header");
  const bookActions = document.getElementById("book-actions");
  const body = document.body;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Frosted glass: visible on scroll; forced on book view —— */
  function updateGlass() {
    const scrolled = window.scrollY > 12;
    header.setAttribute("data-scrolled", scrolled ? "true" : "false");
  }

  function setForceGlass(on) {
    header.setAttribute("data-force-glass", on ? "true" : "false");
  }

  updateGlass();
  window.addEventListener("scroll", updateGlass, { passive: true });

  function setView(name) {
    body.dataset.view = name;
    hub.hidden = name !== "hub";
    book.hidden = name !== "book";
    headerMeta.textContent = name === "book" ? "ignara dos" : "hub";
    setForceGlass(name === "book");
    updateGlass();
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

  /**
   * Blank → noise → resolve (followingwildfire txt-shuffle SHOW remede).
   * - Until reveal wave: character is space (invisible).
   * - Between reveal and resolve: random glyph.
   * - After resolve wave: final character.
   * delay / delayResolve are fractions of duration (FW defaults: delay=0, delayResolve≈0.2).
   */
  function scrambleText(el, options) {
    const opts = Object.assign(
      {
        duration: 1.4,
        delay: 0,
        delayResolve: 0.22,
        fps: 24,
      },
      options || {}
    );

    const finalText = (el.dataset.final || el.dataset.finalText || el.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    el.dataset.final = finalText;

    if (!finalText) {
      el.textContent = "";
      return Promise.resolve();
    }

    if (reduceMotion) {
      el.textContent = finalText;
      return Promise.resolve();
    }

    // Start blank — never flash final copy then glitch
    el.textContent = "";

    return new Promise((resolve) => {
      const chars = finalText.split("");
      const order = chars.map((_, i) => i); // left→right (FW direction RIGHT)
      const frameMs = 1000 / opts.fps;
      const durationMs = opts.duration * 1000;
      const start = performance.now();
      let lastPaint = 0;

      function paint(c) {
        // c is normalized 0..1 over duration (before delay offset)
        const hRaw = clamp01(c - opts.delay);
        const h = quartOut(hRaw);
        const fRaw = clamp01(c - opts.delay - opts.delayResolve);
        const f = quadInOut((1 / (1 - opts.delayResolve)) * fRaw);

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
        if (now - lastPaint < frameMs && now - start < durationMs) {
          requestAnimationFrame(tick);
          return;
        }
        lastPaint = now;
        const c = Math.min(1, (now - start) / durationMs);
        paint(c);
        if (c < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = finalText;
          resolve();
        }
      }

      paint(0);
      requestAnimationFrame(tick);
    });
  }

  function prepareBookBlank() {
    book.classList.add("is-blank");
    book.querySelectorAll("[data-scramble]").forEach((node) => {
      if (!node.dataset.final && node.textContent.trim()) {
        node.dataset.final = node.textContent.replace(/\s+/g, " ").trim();
      }
      node.textContent = "";
    });
    bookActions.classList.add("is-deferred");
    bookActions.classList.remove("is-ready");
  }

  function scrambleAllInBook() {
    const nodes = book.querySelectorAll("[data-scramble]");
    const jobs = [];
    nodes.forEach((node) => {
      const delay = Number(node.dataset.delay || 0);
      const duration = Number(node.dataset.duration || 1.4);
      jobs.push(scrambleText(node, { delay, duration, delayResolve: 0.22 }));
    });
    return Promise.all(jobs).then(() => {
      book.classList.remove("is-blank");
      bookActions.classList.remove("is-deferred");
      bookActions.classList.add("is-ready");
    });
  }

  /* —— Real-ish loading: weighted Promise stages + min dwell ——
   * Weights (documented for Julián):
   *   fonts          40%  — Fragment Mono + Space Grotesk via document.fonts
   *   stylesheet/css 20%  — styles.css fetch (cache-aware)
   *   glyph buffer   15%  — build scramble charset / seed strings (honest prep)
   *   init view      15%  — blank book nodes + prepare scramble finals
   *   min dwell      10%  — floor so the ritual never flashes (~1.2–2.5s total)
   */
  const LOAD_WEIGHTS = {
    fonts: 40,
    assets: 20,
    glyphs: 15,
    init: 15,
    dwell: 10,
  };

  function easeDisplay(current, target) {
    // Smooth chase toward real progress; never pure setInterval 1..100
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
      document.fonts.load('400 1em "Fragment Mono"'),
      document.fonts.load('400 1em "Space Grotesk"'),
      document.fonts.load('700 1em "Space Grotesk"'),
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
    // Honest prep work for scramble: expand charset, prebuild noise pools
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
          // Touch pool so engines keep the work
          window.__ignaraGlyphPool = pool;
          resolve();
        }
      }
      step();
    });
  }

  function initBookView() {
    prepareBookBlank();
    // Prefetch final strings into dataset (already in HTML) + force layout
    book.querySelectorAll("[data-scramble]").forEach((n) => {
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
      loaderStage.textContent = "fuentes";

      // Brief scramble on the loading label (starts blank → resolve)
      loaderText.dataset.final = "Loading_ignara_dos_";
      scrambleText(loaderText, { duration: reduceMotion ? 0.05 : 0.9, delay: 0, delayResolve: 0.2, fps: 20 });

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

      function setStage(label) {
        loaderStage.textContent = label;
      }

      function paintPct() {
        const target = Math.min(100, weightedTotal() * 100);
        displayPct = easeDisplay(displayPct, target);
        const shown = Math.floor(displayPct);
        loaderPct.textContent = shown + "%_";
        if (!finished) requestAnimationFrame(paintPct);
      }
      requestAnimationFrame(paintPct);

      const stages = [
        {
          key: "fonts",
          label: "fuentes",
          run: () =>
            loadFonts().then(() => {
              progress.fonts = 1;
            }),
        },
        {
          key: "assets",
          label: "hoja_de_estilo",
          run: () =>
            loadStylesheet().then(() => {
              progress.assets = 1;
            }),
        },
        {
          key: "glyphs",
          label: "buffer_glifos",
          run: () =>
            decodeGlyphBuffer().then(() => {
              progress.glyphs = 1;
            }),
        },
        {
          key: "init",
          label: "preparar_vista",
          run: () =>
            initBookView().then(() => {
              progress.init = 1;
            }),
        },
      ];

      (async () => {
        // Run fonts + assets in parallel; then glyph decode; then init
        setStage("fuentes + assets");
        await Promise.all([stages[0].run(), stages[1].run()]);
        setStage(stages[2].label);
        await stages[2].run();
        setStage(stages[3].label);
        await stages[3].run();

        // Min dwell: map remaining time into the 10% dwell weight
        const elapsed = performance.now() - startedAt;
        const dwellNeed = Math.max(0, MIN_MS - elapsed);
        setStage("sincronizar");
        const dwellStart = performance.now();
        const dwellTarget = Math.max(dwellNeed, reduceMotion ? 0 : 220);
        while (performance.now() - dwellStart < dwellTarget) {
          const t = clamp01((performance.now() - dwellStart) / dwellTarget);
          progress.dwell = t;
          await wait(32);
        }
        progress.dwell = 1;

        // Cap total so a slow network still finishes cleanly
        const totalElapsed = performance.now() - startedAt;
        if (totalElapsed > MAX_MS) {
          Object.keys(progress).forEach((k) => {
            progress[k] = 1;
          });
        }

        displayPct = 100;
        loaderPct.textContent = "100%_";
        setStage("listo");
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
    enterBtn.disabled = true;
    prepareBookBlank();
    await runLoader();
    setView("book");
    window.scrollTo(0, 0);
    // Book starts blank (only chrome corner); then scramble reveal
    await scrambleAllInBook();
    enterBtn.disabled = false;
  }

  function goHub() {
    prepareBookBlank();
    setView("hub");
    window.scrollTo(0, 0);
  }

  enterBtn.addEventListener("click", enterBook2);
  backBtn.addEventListener("click", goHub);
  brandHome.addEventListener("click", (e) => {
    e.preventDefault();
    if (body.dataset.view !== "hub") goHub();
  });

  // Ensure scramble targets never paint final text before reveal
  prepareBookBlank();
  setView("hub");
})();
