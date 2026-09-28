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
    'uniform float uTime;',   // wall-clock seconds (breathing, shimmer, dither)
    'uniform float uFlow;',   // integrated flow time: runs faster during a scroll surge
    'uniform vec2 uMouse;',   // -1..1, smoothed
    'uniform float uLens;',   // 0..1 cursor lens strength (0 until the pointer is used)
    'uniform float uScroll;', // page scroll, normalized
    'uniform float uOct;',

    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
    'const mat2 R=mat2(.8,.6,-.6,.8);',
    'float fbm4(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=R*p*2.03+11.7;a*=.5;}return v;}',
    'float fbm5(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){if(float(i)>=uOct)break;v+=a*noise(p);p=R*p*2.01+7.3;a*=.5;}return v;}',
    // one gold thread: soft core + wide halo + one-sided satin sheet, with a travelling shimmer
    'float thread(float d,float w,float side,float core){',
    '  return exp(-d*d*w)*core+exp(-d*d*90.)*core*.17+exp(-max(d*side,0.)*10.)*step(0.,d*side)*core*.14;}',

    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/uRes;',
    '  float asp=uRes.x/uRes.y;',
    '  vec2 p=(uv-.5)*vec2(asp,1.);',
    '  vec2 m=uMouse*vec2(asp,1.)*.5;',
    '  float t=uFlow, T=uTime;',
    // cursor lens: soft swirl + pull of the domain around the (smoothed) pointer
    '  vec2 dm=m-p; float d2m=dot(dm,dm);',
    '  float fall=exp(-d2m*3.2)*uLens;',
    '  float ang=fall*(.55+.15*sin(T*.7)); float ca=cos(ang),sa=sin(ang);',
    '  vec2 pl=m+mat2(ca,sa,-sa,ca)*(p-m)+dm*fall*.16;',
    '  vec2 q0=pl*1.35;',
    '  q0.y-=uScroll*.35;',
    '  q0+=vec2(t*.030,-t*.019);',
    // two-level domain warp (about 2.5x the old drift)
    '  vec2 q=vec2(fbm4(q0+vec2(0.,t*.055)),fbm4(q0+vec2(5.2,1.3)-vec2(t*.045,0.)));',
    '  vec2 r=vec2(fbm4(q0+2.6*q+vec2(1.7,9.2)+t*.034),fbm4(q0+2.6*q+vec2(8.3,2.8)-t*.029));',
    '  float f=fbm5(q0+2.2*r);',

    // palette
    '  vec3 base=vec3(.027,.031,.051);',   // #07080d
    '  vec3 navy=vec3(.106,.165,.290);',   // #1b2a4a
    '  vec3 vio=vec3(.231,.180,.361);',    // #3b2e5c
    '  vec3 plum=vec3(.361,.227,.353);',   // #5c3a5a
    '  vec3 gold=vec3(.890,.741,.471);',   // #e3bd78
    '  vec3 ice=vec3(.549,.769,.890);',    // #8cc4e3

    '  vec2 v0=uv-.5; float vig0=1.-dot(v0,v0)*2.;',
    '  vec3 col=base*1.08;',
    // deep body: navy <-> violet <-> plum, driven by the warp vectors
    '  float fn=smoothstep(.16,.80,f);',
    '  col=mix(col,navy,fn);',
    '  col=mix(col,vio,smoothstep(.43,1.03,length(q))*fn*.82);',
    '  col=mix(col,plum,smoothstep(.42,.72,r.x)*smoothstep(.3,.7,f)*.75);',
    // silk folds: bands through the warped field, lit like satin; they visibly slide within seconds
    '  float band=.5+.5*sin(f*9.+r.y*5.-t*.17);',
    '  float fold=pow(band,3.)*smoothstep(.28,.7,f);',
    '  col+=mix(vio,ice,.3)*fold*.42;',
    '  col=mix(col,col*.5,(1.-band)*.54);',
    // cool ice highlight on the crests, very sparse
    '  col+=ice*pow(max(band*smoothstep(.62,.85,r.y),0.),6.)*.11;',
    // slow breathing light: a broad soft swell drifting across the field (periods ~15-30 s)
    '  float br=.5+.5*sin(T*.41+p.x*1.1-p.y*.7)*sin(T*.23+1.7+p.y*.9);',
    '  col*=.92+.14*br;',
    // soft luminance ceiling for the body so text stays readable whatever the phase
    '  float L=dot(col,vec3(.299,.587,.114)); col*=1.37/(1.+L*4.8);',
    // cursor lens light: gentle lift of the silk + faint cool glow under the pointer
    '  float glow=exp(-d2m*9.)*uLens;',
    '  col*=1.+fall*.28;',
    '  col+=mix(vio,ice,.4)*glow*.075+plum*exp(-d2m*2.5)*uLens*.03;',
    // three thin champagne-gold threads riding the warped field; they undulate and travel
    '  float s1=noise(vec2(p.x*.75+t*.045,t*.028))+.5*noise(vec2(p.x*1.6-t*.05,4.1+t*.032));',
    '  float s2=noise(vec2(p.x*.9-t*.04,8.7-t*.03))+.5*noise(vec2(p.x*1.9+t*.055,2.3));',
    '  float s3=noise(vec2(p.x*.6+t*.035,13.1+t*.022))+.5*noise(vec2(p.x*1.4-t*.045,6.6));',
    '  float d1=p.y+.10-(s1-.75)*.55-(q.y-.5)*.35-.035*sin(p.x*3.1+t*.55);',
    '  float d2=p.y-.20-(s2-.75)*.5-(q.x-.5)*.3-.03*sin(p.x*2.6-t*.47+1.2);',
    '  float d3=p.y+.30-(s3-.75)*.45-(r.x-.5)*.28-.04*sin(p.x*2.2+t*.38+2.5);',
    '  float m1=.25+.75*smoothstep(.3,.7,noise(vec2(p.x*1.5-t*.08,1.7)));',
    '  float m2=.15+.85*smoothstep(.35,.75,noise(vec2(p.x*1.7+t*.07,6.3)));',
    '  float m3=.10+.90*smoothstep(.4,.8,noise(vec2(p.x*1.2-t*.06,11.4)));',
    '  vec3 champ=mix(gold,vec3(1.,.9,.72),.3);',
    // width breathes along each thread
    '  float w1=mix(1200.,5200.,noise(vec2(p.x*1.3+t*.05,3.3)));',
    '  float w2=mix(2200.,7000.,noise(vec2(p.x*1.5-t*.06,9.1)));',
    '  float w3=mix(2600.,8000.,noise(vec2(p.x*1.1+t*.04,5.7)));',
    // shimmer: a brighter glint that sweeps along a thread every ~20 s (off-screen half the time)
    '  float sp1=fract(T*.047)*3.4-1.7, sp3=fract(T*.036+.5)*3.4-1.7;',
    '  float sh1=exp(-(p.x-sp1)*(p.x-sp1)*14.), sh3=exp(-(p.x+sp3)*(p.x+sp3)*12.);',
    '  float rib=thread(d1,w1,-1.,.24)*m1*(1.+sh1*1.2);',
    '  float rib2=thread(d2,w2,1.,.15)*m2;',
    '  float rib3=thread(d3,w3,-1.,.11)*m3*(1.+sh3*1.6);',
    '  float fade=smoothstep(.0,.55,vig0);',
    '  col+=champ*rib*fade;',
    '  col+=mix(champ,plum*2.,.35)*rib2*fade;',
    '  col+=mix(champ,ice,.25)*rib3*fade;',
    // warm ember glow from the bottom, echoing the old CSS aurora
    '  col+=vec3(.17,.10,.05)*smoothstep(.65,-.1,uv.y)*smoothstep(.3,.8,f)*(.5+.15*br);',
    // vignette keeps the edges dark
    '  vec2 vv=uv-.5; float vig=1.-smoothstep(.25,.95,dot(vv*vec2(1.,1.15),vv*vec2(1.,1.15))*2.2);',
    '  col*=mix(.25,1.,vig);',
    // final hard-ish ceiling so gold + glow can never blow out behind text
    '  float L2=dot(col,vec3(.299,.587,.114)); col*=min(1.,.40/max(L2,.001));',
    // dither to kill banding
    '  col+=(hash(gl_FragCoord.xy+fract(T))-.5)/255.;',
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
  var uFlow = gl.getUniformLocation(prog, 'uFlow');
  var uLens = gl.getUniformLocation(prog, 'uLens');
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
  var lens = 0, tlens = 0, lastMove = -1e9;
  var sc = 0, tsc = 0, prevSc = 0, surge = 0;
  window.addEventListener('pointermove', function (e) {
    tmx = (e.clientX / window.innerWidth) * 2 - 1;
    tmy = -((e.clientY / window.innerHeight) * 2 - 1);
    if (tlens === 0) { mx = tmx; my = tmy; }   // first contact: lens appears where the pointer is
    tlens = e.pointerType === 'touch' ? 0.6 : 1;
    lastMove = performance.now();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { tlens = 0; }, { passive: true });
  function readScroll() { tsc = (window.scrollY || window.pageYOffset || 0) / Math.max(1, window.innerHeight); }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll(); sc = prevSc = tsc;

  // --- loop ----------------------------------------------------------------
  var FPS = 40, frameMs = 1000 / FPS;
  var raf = 0, last = 0, simT = 0, flowT = 0, prevNow = 0, shown = false, lost = false;
  var seed = typeof window.__BG_SEED === 'number' ? window.__BG_SEED : 40 + Math.random() * 400;         // random phase so every visit is different

  function draw(dt) {
    var k = 1 - Math.exp(-dt * 3.2);            // exponential smoothing, frame-rate independent
    mx += (tmx - mx) * k; my += (tmy - my) * k;
    // lens fades in on movement, relaxes to a softer resting strength after ~4 s idle
    var lt = tlens * (performance.now() - lastMove > 4000 ? 0.55 : 1);
    lens += (lt - lens) * (1 - Math.exp(-dt * 1.6));
    sc += (tsc - sc) * (1 - Math.exp(-dt * 4));
    // scroll velocity (viewports/s) feeds a decaying surge of flow speed
    if (dt > 0) {
      var v = Math.abs(sc - prevSc) / dt;
      surge = Math.max(surge * Math.exp(-dt * 1.4), Math.min(v * 0.9, 2.2));
    }
    prevSc = sc;
    flowT += dt * (1 + surge);
    gl.uniform1f(uTime, seed + simT);
    gl.uniform1f(uFlow, seed + flowT);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uLens, lens);
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

  function renderStatic() { stop(); mx = tmx = 0; my = tmy = 0; lens = tlens = 0; surge = 0; draw(0); }

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
