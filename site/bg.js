/* Liquid-silk aurora backdrop: real-time WebGL1 shader (no video, no libraries).
   Falls back silently to the CSS auroras if WebGL is unavailable. */
(function () {
  'use strict';
  var backdrop = document.querySelector('.backdrop');
  if (!backdrop || !window.WebGLRenderingContext) return;

  var mqMobile = window.matchMedia('(max-width: 760px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 1.6s ease;';

  var gl;
  try {
    var opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' };
    gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  } catch (e) { gl = null; }
  if (!gl) return;

  var VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform vec2 uMouse;',   // -1..1, smoothed
    'uniform float uScroll;', // page scroll, normalized
    'uniform float uOct;',

    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
    'const mat2 R=mat2(.8,.6,-.6,.8);',
    'float fbm4(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=R*p*2.03+11.7;a*=.5;}return v;}',
    'float fbm5(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){if(float(i)>=uOct)break;v+=a*noise(p);p=R*p*2.01+7.3;a*=.5;}return v;}',

    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/uRes;',
    '  float asp=uRes.x/uRes.y;',
    '  vec2 p=(uv-.5)*vec2(asp,1.);',
    '  vec2 m=uMouse*vec2(asp,1.)*.5;',
    '  float t=uTime;',
    // gentle mouse bend: pull the domain toward the pointer with a soft falloff
    '  vec2 dm=m-p; float fall=exp(-dot(dm,dm)*2.2);',
    '  vec2 q0=p*1.35+dm*fall*.22;',
    '  q0.y-=uScroll*.35;',
    '  q0+=vec2(t*.011,-t*.007);',
    // two-level domain warp
    '  vec2 q=vec2(fbm4(q0+vec2(0.,t*.021)),fbm4(q0+vec2(5.2,1.3)-vec2(t*.017,0.)));',
    '  vec2 r=vec2(fbm4(q0+2.6*q+vec2(1.7,9.2)+t*.013),fbm4(q0+2.6*q+vec2(8.3,2.8)-t*.011));',
    '  float f=fbm5(q0+2.2*r);',

    // palette
    '  vec3 base=vec3(.027,.031,.051);',   // #07080d
    '  vec3 navy=vec3(.106,.165,.290);',   // #1b2a4a
    '  vec3 vio=vec3(.231,.180,.361);',    // #3b2e5c
    '  vec3 plum=vec3(.361,.227,.353);',   // #5c3a5a
    '  vec3 gold=vec3(.890,.741,.471);',   // #e3bd78
    '  vec3 ice=vec3(.549,.769,.890);',    // #8cc4e3

    '  vec2 v0=uv-.5; float vig0=1.-dot(v0,v0)*2.;',
    '  vec3 col=base;',
    // deep body: navy <-> violet <-> plum, driven by the warp vectors
    '  float fn=smoothstep(.18,.82,f);',
    '  col=mix(col,navy*.9,fn);',
    '  col=mix(col,vio,smoothstep(.45,1.05,length(q))*fn*.8);',
    '  col=mix(col,plum,smoothstep(.42,.72,r.x)*smoothstep(.3,.7,f)*.75);',
    // silk folds: low-frequency bands through the warped field, lit like satin
    '  float band=.5+.5*sin(f*9.+r.y*5.-t*.03);',
    '  float fold=pow(band,3.)*smoothstep(.3,.7,f);',
    '  col+=mix(vio,ice,.3)*fold*.36;',
    '  col=mix(col,col*.45,(1.-band)*.6);',
    // cool ice highlight on the crests, very sparse
    '  col+=ice*pow(max(band*smoothstep(.62,.85,r.y),0.),6.)*.10;',
    // soft luminance ceiling for the body so text stays readable whatever the phase
    '  float L=dot(col,vec3(.299,.587,.114)); col*=1.3/(1.+L*5.);',
    // thin champagne-gold ribbons: two long silk threads riding the warped field
    '  float s1=noise(vec2(p.x*.75+t*.018,t*.011))+.5*noise(vec2(p.x*1.6-t*.02,4.1+t*.013));',
    '  float s2=noise(vec2(p.x*.9-t*.016,8.7-t*.012))+.5*noise(vec2(p.x*1.9+t*.022,2.3));',
    '  float d1=p.y+.10-(s1-.75)*.55-(q.y-.5)*.35;',
    '  float d2=p.y-.20-(s2-.75)*.5-(q.x-.5)*.3;',
    '  float m1=.25+.75*smoothstep(.3,.7,noise(vec2(p.x*1.5-t*.035,1.7)));',
    '  float m2=.15+.85*smoothstep(.35,.75,noise(vec2(p.x*1.7+t*.03,6.3)));',
    '  vec3 champ=mix(gold,vec3(1.,.9,.72),.3);',
    // width breathes along the thread; a soft one-sided sheet trails each thread like light on satin
    '  float w1=mix(1200.,5200.,noise(vec2(p.x*1.3+t*.02,3.3)));',
    '  float w2=mix(2200.,7000.,noise(vec2(p.x*1.5-t*.024,9.1)));',
    '  float rib=(exp(-d1*d1*w1)*.24+exp(-d1*d1*80.)*.04+exp(-max(-d1,0.)*9.)*step(d1,0.)*.035)*m1;',
    '  float rib2=(exp(-d2*d2*w2)*.15+exp(-d2*d2*110.)*.025+exp(-max(d2,0.)*11.)*step(0.,d2)*.02)*m2;',
    '  float fade=smoothstep(.0,.55,vig0);',
    '  col+=champ*rib*fade;',
    '  col+=mix(champ,plum*2.,.35)*rib2*fade;',
    // warm ember glow from the bottom, echoing the old CSS aurora
    '  col+=vec3(.17,.10,.05)*smoothstep(.65,-.1,uv.y)*smoothstep(.3,.8,f)*.55;',
    // vignette + darken toward the top-left text area a touch
    '  vec2 vv=uv-.5; float vig=1.-smoothstep(.25,.95,dot(vv*vec2(1.,1.15),vv*vec2(1.,1.15))*2.2);',
    '  col*=mix(.22,1.,vig);',
    // dither to kill banding
    '  col+=(hash(gl_FragCoord.xy+fract(t))-.5)/255.;',
    '  gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'a');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes');
  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uMouse = gl.getUniformLocation(prog, 'uMouse');
  var uScroll = gl.getUniformLocation(prog, 'uScroll');
  var uOct = gl.getUniformLocation(prog, 'uOct');

  // --- sizing -------------------------------------------------------------
  var W = 0, H = 0;
  function resize() {
    var mobile = mqMobile.matches;
    var scale = mobile ? 0.45 : 0.55;          // fraction of CSS pixels (DPR ignored on purpose)
    var cw = window.innerWidth, ch = window.innerHeight;
    var w = Math.max(1, Math.round(cw * scale));
    var h = Math.max(1, Math.round(ch * scale));
    var maxPx = mobile ? 90000 : 420000;        // hard pixel budget
    if (w * h > maxPx) { var k = Math.sqrt(maxPx / (w * h)); w = Math.round(w * k); h = Math.round(h * k); }
    if (w !== W || h !== H) {
      W = canvas.width = w; H = canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, W, H);
    gl.uniform1f(uOct, mobile ? 4 : 5);
  }

  // --- input (smoothed) --------------------------------------------------
  var mx = 0, my = 0, tmx = 0, tmy = 0;
  var sc = 0, tsc = 0;
  window.addEventListener('pointermove', function (e) {
    tmx = (e.clientX / window.innerWidth) * 2 - 1;
    tmy = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
  function readScroll() { tsc = (window.scrollY || window.pageYOffset || 0) / Math.max(1, window.innerHeight); }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll(); sc = tsc;

  // --- loop ----------------------------------------------------------------
  var FPS = 36, frameMs = 1000 / FPS;
  var raf = 0, last = 0, simT = 0, prevNow = 0, shown = false, lost = false;
  var seed = typeof window.__BG_SEED === 'number' ? window.__BG_SEED : 40 + Math.random() * 400;         // random phase so every visit is different

  function draw(dt) {
    var k = 1 - Math.exp(-dt * 2.2);            // exponential smoothing, frame-rate independent
    mx += (tmx - mx) * k; my += (tmy - my) * k;
    sc += (tsc - sc) * (1 - Math.exp(-dt * 4));
    gl.uniform1f(uTime, seed + simT);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uScroll, sc);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!shown) reveal();
  }

  function reveal() {
    shown = true;
    backdrop.classList.add('has-gl');
    requestAnimationFrame(function () { canvas.style.opacity = '1'; });
    // hide CSS auroras once the canvas has faded in
    setTimeout(function () {
      if (lost) return;
      var a = backdrop.querySelectorAll('.aurora');
      for (var i = 0; i < a.length; i++) a[i].style.display = 'none';
    }, 1700);
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (now - last < frameMs - 2) return;
    var dt = prevNow ? Math.min((now - prevNow) / 1000, 0.1) : 0;
    prevNow = now; last = now;
    simT += dt;
    draw(dt);
  }

  function start() {
    if (raf || lost || document.hidden || mqReduce.matches) return;
    prevNow = 0;
    raf = requestAnimationFrame(tick);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  function renderStatic() { stop(); mx = tmx = 0; my = tmy = 0; draw(0); }

  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

  var rzT = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rzT);
    rzT = setTimeout(function () { resize(); if (!raf) draw(0); }, 120);
  }, { passive: true });

  function onReduce() { if (mqReduce.matches) renderStatic(); else start(); }
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onReduce);
  else if (mqReduce.addListener) mqReduce.addListener(onReduce);
  if (mqMobile.addEventListener) mqMobile.addEventListener('change', resize);

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); lost = true; stop();
    backdrop.classList.remove('has-gl');
    canvas.style.opacity = '0';
    var a = backdrop.querySelectorAll('.aurora');
    for (var i = 0; i < a.length; i++) a[i].style.display = '';
  });

  backdrop.insertBefore(canvas, backdrop.firstChild);
  resize();
  if (mqReduce.matches) renderStatic(); else start();
})();
