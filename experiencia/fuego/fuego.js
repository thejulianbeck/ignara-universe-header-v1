(function () {
  var IX = window.IX, cv = document.getElementById("gl"), fb = document.getElementById("fb"), hint = document.getElementById("hint"),
    card = document.getElementById("card"), B = document.body, I = 0, hold = false, done = false, last = performance.now(), t0 = last, g, U = {};
  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FS = "precision mediump float;uniform vec2 r;uniform float t,i;" +
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
    "float n(vec2 p){vec2 f=fract(p),u=f*f*(3.-2.*f);p=floor(p);return mix(mix(h(p),h(p+vec2(1,0)),u.x),mix(h(p+vec2(0,1)),h(p+1.),u.x),u.y);}" +
    "float fb(vec2 p){float v=0.,a=.5;for(int k=0;k<4;k++){v+=a*n(p);p*=2.03;a*=.5;}return v;}" +
    "void main(){vec2 uv=(gl_FragCoord.xy-vec2(.5*r.x,.3*r.y))/r.y;" +
    "float e=.035+.03*sin(t*2.)*.3;float em=smoothstep(e+.05,0.,length(uv*vec2(1.,1.6)));" +
    "float H=.05+i*.55;vec2 q=uv;q.x*=1.+q.y*1.5/max(H,.06);" +
    "float ns=fb(vec2(q.x*5.,q.y*4.-t*(1.5+i*2.)));" +
    "float sh=1.-smoothstep(0.,.10+.12*i,abs(q.x)+(ns-.5)*.12*(.4+i));" +
    "float vt=smoothstep(-.04,.02,uv.y)*(1.-smoothstep(0.,H,uv.y+(ns-.5)*.2*i));" +
    "float f=clamp(sh*vt*(.6+ns),0.,1.)*smoothstep(0.,.08,i);" +
    "float glo=exp(-length(uv*vec2(1.,1.3))*(9.-6.*i))*(.25+.75*i);" +
    "vec3 c=mix(vec3(.9,.18,.02),vec3(1.,.62,.15),smoothstep(.2,.6,f));c=mix(c,vec3(1.,.95,.75),smoothstep(.7,1.,f));" +
    "vec3 col=c*f+vec3(1.,.45,.1)*glo*.6+vec3(1.,.4,.1)*em*(.7+.3*sin(t*3.));" +
    "gl_FragColor=vec4(col,1.);}";
  try {
    g = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    var sh = function (ty, s) { var o = g.createShader(ty); g.shaderSource(o, s); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw g.getShaderInfoLog(o); return o; };
    var pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr); g.useProgram(pr);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    var lp = g.getAttribLocation(pr, "p"); g.enableVertexAttribArray(lp); g.vertexAttribPointer(lp, 2, g.FLOAT, false, 0, 0);
    ["r", "t", "i"].forEach(function (k) { U[k] = g.getUniformLocation(pr, k); });
  } catch (e) { g = null; cv.style.display = "none"; fb.style.display = "block"; }
  var sc = Math.min(IX.dpr, 1.5);
  function size() { if (!g) return; cv.width = innerWidth * sc | 0; cv.height = innerHeight * sc | 0; g.viewport(0, 0, cv.width, cv.height); }
  size(); addEventListener("resize", size);
  var br = null;
  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!done) {
      I = hold ? Math.min(1, I + dt * .32) : Math.max(0, I - dt * .12);
      if (hold && Math.random() < .08) IX.buzz(6); if (hold && Math.random() < .12) IX.S.breath(I);
      if (I >= 1) reveal();
    } else I = Math.min(1, I + dt);
    B.style.setProperty("--i", I.toFixed(3));
    if (g) { g.uniform2f(U.r, cv.width, cv.height); g.uniform1f(U.t, (now - t0) / 1000); g.uniform1f(U.i, done ? .85 : I); g.drawArrays(g.TRIANGLES, 0, 3); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  function down(e) { if (done || (e.target.closest && e.target.closest(".snd,.card,.btn-rm"))) return; hold = true; hint.classList.add("off");  }
  function up() { hold = false; if (br && br.stop) { try { br.stop(); } catch (e) { } } br = null; if (!done && I < 1) { hint.textContent = "Sigue soplando: mantén presionado"; hint.classList.remove("off"); } }
  addEventListener("pointerdown", down); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  addEventListener("keydown", function (e) { if (e.key === " " && !e.repeat && e.target === B) { e.preventDefault(); down(e); } });
  addEventListener("keyup", function (e) { if (e.key === " ") up(); });
  addEventListener("contextmenu", function (e) { e.preventDefault(); });
  function reveal() {
    if (done) return; done = true; hold = false; up(); hint.classList.add("off");
    B.classList.add("lit"); IX.S.crackle && IX.S.crackle(); IX.buzz([30, 50, 80]);
    setTimeout(function () { card.classList.add("in"); }, IX.R ? 300 : 3200);
  }
  if (IX.R) { B.classList.add("rm"); hint.classList.add("off"); }
  document.getElementById("rmb").addEventListener("click", function () { I = 1; reveal(); });
  IX.form(document.getElementById("fm"), function () {
    card.querySelector(".k").textContent = "Fuego encendido"; card.querySelector("h2").textContent = "Gracias por cuidarlo.";
  });
  window.__f = { reveal: reveal, set: function (v) { I = v; } };
})();
