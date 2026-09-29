(function () {
  const GLYPHS =
    " !#$&%()*+0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";

  const hub = document.getElementById("view-hub");
  const book = document.getElementById("view-book");
  const loader = document.getElementById("loader");
  const loaderIcon = document.getElementById("loader-icon");
  const loaderText = document.getElementById("loader-text");
  const loaderPct = document.getElementById("loader-pct");
  const enterBtn = document.getElementById("enter-book-2");
  const backBtn = document.getElementById("back-hub");
  const brandHome = document.getElementById("brand-home");
  const headerMeta = document.getElementById("header-meta");
  const body = document.body;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setView(name) {
    body.dataset.view = name;
    hub.hidden = name !== "hub";
    book.hidden = name !== "book";
    headerMeta.textContent = name === "book" ? "ignara dos" : "hub";
  }

  function randomGlyph() {
    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }

  /**
   * Scramble / decode text reveal (remede of followingwildfire txt-shuffle):
   * characters flicker through glyph noise, then resolve left→right.
   */
  function scrambleText(el, options) {
    const opts = Object.assign(
      { duration: 1600, delay: 0, fps: 22, reveal: true },
      options || {}
    );
    const finalText = (el.dataset.finalText || el.textContent || "").replace(/\s+/g, " ").trim();
    el.dataset.finalText = finalText;

    if (reduceMotion) {
      el.textContent = finalText;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      window.setTimeout(() => {
        const chars = finalText.split("");
        const start = performance.now();
        let frame = 0;

        function paint(progress) {
          const revealCount = opts.reveal
            ? Math.floor(progress * chars.length)
            : chars.length;
          const html = chars
            .map((ch, i) => {
              if (ch === " ") return " ";
              if (i < revealCount) {
                // late frames: mostly settled, early: noisy
                const settle = progress > 0.82 || Math.random() < progress * 0.85;
                if (settle) {
                  return `<span class="glyph">${ch}</span>`;
                }
                return `<span class="glyph is-noise">${randomGlyph()}</span>`;
              }
              return `<span class="glyph is-noise">${randomGlyph()}</span>`;
            })
            .join("");
          el.innerHTML = html;
        }

        function tick(now) {
          const t = Math.min(1, (now - start) / opts.duration);
          // easeOut-ish
          const eased = 1 - Math.pow(1 - t, 2.2);
          frame += 1;
          if (frame % 1 === 0) paint(eased);
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            el.textContent = finalText;
            resolve();
          }
        }

        paint(0);
        requestAnimationFrame(tick);
      }, opts.delay);
    });
  }

  function scrambleAllInBook() {
    const nodes = book.querySelectorAll("[data-scramble]");
    const jobs = [];
    nodes.forEach((node) => {
      const delay = Number(node.dataset.delay || 0);
      const duration = Number(node.dataset.duration || 1600);
      jobs.push(scrambleText(node, { delay, duration }));
    });
    return Promise.all(jobs);
  }

  function runLoader() {
    return new Promise((resolve) => {
      loader.hidden = false;
      loader.classList.remove("is-leaving");
      loader.classList.add("is-on");
      loaderIcon.classList.add("is-glitch");
      loaderText.textContent = "Loading_ignara_dos_";
      loaderPct.textContent = "0%_";

      // Brief scramble on the loading label itself
      scrambleText(loaderText, { duration: reduceMotion ? 0 : 900, delay: 0, fps: 18 });

      const duration = reduceMotion ? 400 : 2200;
      const start = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const pct = Math.floor(t * 100);
        loaderPct.textContent = pct + "%_";
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          loaderPct.textContent = "100%_";
          loaderIcon.classList.remove("is-glitch");
          window.setTimeout(() => {
            loader.classList.add("is-leaving");
            window.setTimeout(() => {
              loader.hidden = true;
              loader.classList.remove("is-on", "is-leaving");
              resolve();
            }, reduceMotion ? 0 : 350);
          }, reduceMotion ? 0 : 280);
        }
      }

      requestAnimationFrame(tick);
    });
  }

  async function enterBook2() {
    enterBtn.disabled = true;
    await runLoader();
    setView("book");
    window.scrollTo(0, 0);
    await scrambleAllInBook();
    enterBtn.disabled = false;
  }

  function goHub() {
    setView("hub");
    window.scrollTo(0, 0);
  }

  enterBtn.addEventListener("click", enterBook2);
  backBtn.addEventListener("click", goHub);
  brandHome.addEventListener("click", (e) => {
    e.preventDefault();
    if (body.dataset.view !== "hub") goHub();
  });

  setView("hub");
})();
