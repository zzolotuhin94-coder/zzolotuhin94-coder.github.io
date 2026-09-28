// Portfolio page behaviour: nav, reveal, 3D hero parallax, product tour, counters, spotlight cards,
// AlpenGo screen gallery, autoplaying demo videos, lightbox.
(function () {
  // Link for the "Message me on Fiverr" button.
  var FIVERR_URL = 'https://www.fiverr.com/zolotuhindev';

  // Interactive tour on the AlpenGo case study (files in site/img/alpengo/).
  var TOUR = [
    { file: 'tab-floor-live', kind: 'tablet', app: 'Partner app', title: 'Live floor plan', text: 'Tables turn free, reserved or occupied the moment a booking changes — pushed over Socket.io, with overstay warnings for the host.' },
    { file: 'tab-floor-edit', kind: 'tablet', app: 'Partner app', title: 'Floor-plan editor', text: 'Owners draw their own room: drag, resize and number tables, add the bar, walls and entrance.' },
    { file: 'guest-concierge-day', app: 'Guest app', title: 'Fabi, the AI concierge', text: 'Guests ask in their own language — “where can we eat fondue tonight?” — and Fabi answers from resort data through the Claude API.' },
    { file: 'guest-booking-calendar-day', app: 'Guest app', title: 'Booking in three taps', text: 'Pick a day, party size and a free slot. Availability comes from the restaurant’s own tables, so nothing is double-booked.' },
    { file: 'guest-home-night', app: 'Guest app', title: 'Today in the resort', text: 'Weather at altitude, lift status, events and recommendations. The theme follows the sky — sunrise by day, dusk after 18:00.' },
    { file: 'tab-superadmin', kind: 'tablet', app: 'Admin console', title: 'Command center', text: 'The resort team sees sign-ups, users, tickets and live system alerts across every business on the platform.' }
  ];
  var TOUR_MS = 6000;

  // Full screen gallery. Order = order on the page.
  // Screen gallery: three key screens per app. Order = order on the page.
  // Add a Jang group here once its screenshots are in site/img/jang/ (use dir: 'jang').
  var ALPENGO_SCREENS = [
    { group: 'Guest app', file: 'guest-home-night', title: 'Today in the resort', text: 'Weather at altitude, lifts and tonight’s events' },
    { group: 'Guest app', file: 'guest-concierge-day', title: 'Fabi, the AI concierge', text: 'Claude-powered answers about the resort' },
    { group: 'Guest app', file: 'guest-booking-calendar-day', title: 'Booking calendar', text: 'Live availability by party size and time' },
    { group: 'Partner app & admin console · tablet', kind: 'tablet', file: 'tab-superadmin', title: 'Command center', text: 'Sign-ups, users, tickets, live system alerts, health and backups' },
    { group: 'Partner app & admin console · tablet', kind: 'tablet', file: 'tab-timeline', title: 'Occupancy calendar', text: 'Rooms × days view of every stay' },
    { group: 'Partner app & admin console · tablet', kind: 'tablet', file: 'tab-rooms', title: 'Hotel rooms', text: 'Housekeeping status per room' },
    { group: 'Partner app & admin console · tablet', kind: 'tablet', file: 'tab-home', title: 'Live dashboard', text: 'Today’s bookings and quick actions' },
    { group: 'Partner app & admin console · tablet', kind: 'tablet', file: 'tab-menu-builder', title: 'Menu builder', text: 'PDF upload, photo scan or manual dishes' },
    { group: 'Partner app & admin console · tablet', kind: 'tablet', file: 'tab-floor-edit', title: 'Floor-plan editor', text: 'Drag, resize and add tables, walls and the bar' }
  ];

  var GALLERIES = {
    scroll3d: [
      ['scroll-3d-hero', 'AURA One hero with the 3D headphones'],
      ['scroll-3d-exploded', 'Headphones exploded into parts with captions'],
      ['scroll-3d-colours', 'Colour switch changing the whole page'],
      ['scroll-3d-mobile-exploded', 'Exploded view on mobile']
    ],
    ai: [
      ['ai-assistant-desktop', 'AI assistant chat on the coffee-shop site'],
      ['ai-how', 'How the AI assistant works'],
      ['ai-assistant-mobile', 'AI assistant full-screen on mobile']
    ]
  };

  document.documentElement.classList.remove('no-js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  document.getElementById('hire-link').href = FIVERR_URL;
  document.getElementById('year').textContent = new Date().getFullYear();

  // Sticky nav background
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 20); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
  }
  toggle.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
  });

  // Hero: intro, shared floating motion, inertial pointer parallax, scroll spread,
  // screens cycling inside the devices and live-event toasts.
  var heroEl = document.querySelector('.hero');
  var stageEl = document.querySelector('.stage');
  var stage = document.querySelector('.stage__inner');
  var devices = [].slice.call(document.querySelectorAll('.stage .device'));
  // How far each device drifts apart while the hero scrolls away (px at full scroll)
  var SPREAD = { 'device--left': [0, -140], 'device--center': [-110, 60], 'device--right': [110, 90] };
  var INTRO_DELAY = { 'device--left': 350, 'device--center': 600, 'device--right': 800 };

  devices.forEach(function (d) {
    var screen = d.querySelector('.device__screen');
    var first = screen.querySelector('img');
    (d.dataset.screens || '').split(',').slice(1).forEach(function (name) {
      var img = document.createElement('img');
      img.src = 'site/img/alpengo/' + name + '.webp';
      img.alt = '';
      img.loading = 'lazy';
      img.width = first.width; img.height = first.height;
      screen.appendChild(img);
    });
    var key = Object.keys(SPREAD).filter(function (k) { return d.classList.contains(k); })[0];
    d._spread = SPREAD[key];
    d._delay = INTRO_DELAY[key];
    d._depth = parseFloat(d.dataset.depth) || 1;
  });
  stageEl.classList.add('is-live');

  if (!reduceMotion) {
    var t0 = performance.now();
    var ptr = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, heroOn = true, running = false;
    if (finePointer) {
      heroEl.addEventListener('pointermove', function (e) {
        var r = heroEl.getBoundingClientRect();
        ptr.x = (e.clientX - r.left) / r.width - 0.5;
        ptr.y = (e.clientY - r.top) / r.height - 0.5;
      });
      heroEl.addEventListener('pointerleave', function () { ptr.x = 0; ptr.y = 0; });
    }
    if (hasIO) new IntersectionObserver(function (en) { heroOn = en[0].isIntersecting; if (heroOn && !running) { running = true; requestAnimationFrame(frame); } }).observe(heroEl);
    var ease = function (x) { return 1 - Math.pow(1 - x, 4); };
    var smallScreen = window.matchMedia('(max-width: 760px)').matches;
    var frame = function (now) {
      if (!heroOn) { running = false; return; }
      var t = now - t0;
      // while the visitor is using one of the live devices, hold the scene still
      var using = stageEl.matches(':hover') && !!stageEl.querySelector('.device:hover');
      if (!using) {
        cur.x += (ptr.x - cur.x) * 0.06;
        cur.y += (ptr.y - cur.y) * 0.06;
      }
      var sp = Math.min(Math.max(window.scrollY / heroEl.offsetHeight, 0), 1);
      if (smallScreen) sp = 0; // on phones the devices stay put so they can be tapped
      stage.style.setProperty('--ry', (-10 + cur.x * 16).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (6 - cur.y * 10 + sp * 14).toFixed(2) + 'deg');
      devices.forEach(function (d, i) {
        var k = ease(Math.min(Math.max((t - d._delay) / 1300, 0), 1));
        // hovering a device calms it down so it can be tapped comfortably
        d._calm = (d._calm == null ? 1 : d._calm) + ((d.matches(':hover') ? 0 : 1) - (d._calm == null ? 1 : d._calm)) * 0.08;
        // one shared 7s rhythm, phases spread so neighbours never move toward each other at once
        var fy = Math.sin(t / 7000 * Math.PI * 2 + i * 2.1) * 9 * d._depth * d._calm;
        var x = cur.x * 36 * d._depth * d._calm + d._spread[0] * sp;
        var y = cur.y * 26 * d._depth * d._calm + fy + d._spread[1] * sp + (1 - k) * 140;
        d.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
        d.style.opacity = (k * (1 - sp * 0.6)).toFixed(3);
        d.style.filter = k < 1 ? 'blur(' + ((1 - k) * 14).toFixed(1) + 'px)' : '';
      });
      requestAnimationFrame(frame);
    };
    running = true;
    requestAnimationFrame(frame);

    // Screens inside each device take turns changing
    var tick = 0;
    setInterval(function () {
      if (!heroOn || document.hidden) return;
      var d = devices[tick % devices.length];
      var imgs = d.querySelectorAll('.device__screen > img');
      if (imgs.length > 1) {
        var i = [].indexOf.call(imgs, d.querySelector('.device__screen > img.is-on'));
        imgs[i].classList.remove('is-on');
        imgs[(i + 1) % imgs.length].classList.add('is-on');
      }
      tick++;
    }, 2600);

    // Live-event toasts: at most two visible, one appears as the oldest leaves
    var toasts = document.querySelectorAll('.toast');
    var ti = 0;
    // once the visitor starts using the live devices, the decorative toasts step aside
    var toastsOff = false;
    stageEl.addEventListener('pointerdown', function () {
      toastsOff = true;
      toasts.forEach(function (x) { x.classList.remove('is-on'); });
    });
    var nextToast = function () {
      if (toastsOff) return;
      if (heroOn && !document.hidden) {
        toasts[ti % toasts.length].classList.add('is-on');
        toasts[(ti + toasts.length - 2) % toasts.length].classList.remove('is-on');
        ti++;
      }
      setTimeout(nextToast, 2400);
    };
    setTimeout(nextToast, 1900);
  }

  // Spotlight cards: glow follows the pointer
  if (finePointer) {
    document.querySelectorAll('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // Product tour
  var tour = document.getElementById('tour');
  var phoneScreens = tour.querySelector('.device--tour .device__screens');
  var tabletScreens = tour.querySelector('.tour__tablet .device__screens');
  var tourDevice = tour.querySelector('.tour__device');
  var list = tour.querySelector('.tour__list');
  var tourIndex = 0, tourTimer = null, tourVisible = false, tourPaused = reduceMotion;
  TOUR.forEach(function (t, i) {
    var img = document.createElement('img');
    img.src = 'site/img/alpengo/' + t.file + '.webp';
    img.alt = t.app + ' — ' + t.title;
    var tablet = t.kind === 'tablet';
    img.width = tablet ? 1800 : 520; img.height = tablet ? 1257 : 1125;
    if (i > 0) img.loading = 'lazy';
    (tablet ? tabletScreens : phoneScreens).appendChild(img);
    t.img = img;

    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.className = 'tour__btn';
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.id = 'tour-tab-' + i;
    btn.innerHTML = '<span class="tour__num"></span><span class="tour__title"></span><span class="tour__text"></span><span class="tour__bar"></span>';
    btn.querySelector('.tour__num').textContent = '0' + (i + 1);
    btn.querySelector('.tour__title').textContent = t.title;
    var app = document.createElement('span');
    app.className = 'tour__app';
    app.textContent = t.app;
    btn.querySelector('.tour__title').appendChild(app);
    btn.querySelector('.tour__text').textContent = t.text;
    btn.addEventListener('click', function () {
      tourPaused = true; tour.classList.add('is-paused'); showTour(i);
      // on stacked layouts the device sits above the list — bring it into view
      if (window.innerWidth < 1081) tourDevice.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
  var tabs = list.querySelectorAll('.tour__btn');
  tour.style.setProperty('--dur', TOUR_MS + 'ms');
  if (tourPaused) tour.classList.add('is-paused');
  function showTour(i) {
    tourIndex = i;
    tabs.forEach(function (b, j) {
      b.setAttribute('aria-selected', String(j === i));
      b.tabIndex = j === i ? 0 : -1;
      // restart the progress bar animation
      var bar = b.querySelector('.tour__bar');
      bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    });
    TOUR.forEach(function (t, j) { t.img.classList.toggle('is-active', j === i); });
    tourDevice.classList.toggle('is-tablet', TOUR[i].kind === 'tablet');
    clearTimeout(tourTimer);
    if (!tourPaused && tourVisible) tourTimer = setTimeout(function () { showTour((tourIndex + 1) % TOUR.length); }, TOUR_MS);
  }
  list.addEventListener('keydown', function (e) {
    var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    tourPaused = true; tour.classList.add('is-paused');
    var n = (tourIndex + d + TOUR.length) % TOUR.length;
    showTour(n); tabs[n].focus();
  });
  if (finePointer && !reduceMotion) {
    tourDevice.addEventListener('pointermove', function (e) {
      var r = tourDevice.getBoundingClientRect();
      tourDevice.style.setProperty('--tx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      tourDevice.style.setProperty('--ty', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    tourDevice.addEventListener('pointerleave', function () { tourDevice.style.setProperty('--tx', 0); tourDevice.style.setProperty('--ty', 0); });
  }
  // 3D device models: stacked layers give the body thickness, a back plate shows when turned
  var LOGO_BACK = '<span class="m3d__cams"><i></i><i></i><i></i></span><img src="site/img/alpengo-logo.webp" alt="">';
  function modelBody(el, depth, backHtml, backClass) {
    el.classList.add('m3d-body');
    el.style.setProperty('--depth', depth + 'px');
    for (var z = 1; z <= depth; z++) {
      var layer = document.createElement('span');
      layer.className = 'm3d__layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.style.transform = 'translateZ(' + (-z) + 'px)';
      el.appendChild(layer);
    }
    var back = document.createElement('span');
    back.className = 'm3d__back' + (backClass ? ' ' + backClass : '');
    back.setAttribute('aria-hidden', 'true');
    back.innerHTML = backHtml || LOGO_BACK;
    el.appendChild(back);
  }
  // Drag (mouse or horizontal swipe) spins the model with inertia, then it eases back to the front
  function spinner(dragEl, varsEl, onGrab) {
    var rx = 0, ry = 0, vx = 0, vy = 0, drag = null, idle = 0, raf = null;
    function apply() {
      varsEl.style.setProperty('--mrx', rx.toFixed(2) + 'deg');
      varsEl.style.setProperty('--mry', ry.toFixed(2) + 'deg');
    }
    function loop(now) {
      raf = null;
      if (drag) return;
      rx = Math.max(-65, Math.min(65, rx + vx)); ry += vy;
      vx *= 0.93; vy *= 0.93;
      if (Math.abs(vx) + Math.abs(vy) < 0.05) {
        if (!idle) idle = now;
        if (now - idle > 1600) {
          var home = Math.round(ry / 360) * 360;
          rx += (0 - rx) * 0.06; ry += (home - ry) * 0.06;
          if (Math.abs(rx) < 0.05 && Math.abs(ry - home) < 0.05) { rx = 0; ry = 0; apply(); dragEl.classList.remove('is-grab'); return; }
        }
      } else idle = 0;
      apply();
      raf = requestAnimationFrame(loop);
    }
    dragEl.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, moved: false };
      vx = vy = 0; idle = 0;
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        // vertical swipes on touch keep scrolling the page
        if (e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        drag.moved = true;
        dragEl.classList.add('is-grab', 'was-grabbed');
        try { dragEl.setPointerCapture(e.pointerId); } catch (err) {}
        if (onGrab) onGrab();
      }
      var now = performance.now(), dt = Math.max(now - drag.t, 1);
      var sy = dx * 0.45, sx = -dy * 0.35;
      ry += sy; rx = Math.max(-65, Math.min(65, rx + sx));
      vy = sy / dt * 16; vx = sx / dt * 16;
      drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
      apply();
    });
    var end = function () {
      if (!drag) return;
      var moved = drag.moved;
      drag = null;
      if (moved && !raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }
  var ROTATE_ICON = '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2"/><path d="M18.5 2v4h-4M5.5 22v-4h4"/></svg>';

  // Tour: both the phone and the tablet are models, the whole stage is the drag area
  modelBody(tour.querySelector('.device--tour'), 10);
  modelBody(tour.querySelector('.tour__bezel'), 8, null, 'm3d__back--tablet');
  var tourHint = document.createElement('span');
  tourHint.className = 'tour__hint';
  tourHint.innerHTML = ROTATE_ICON + 'Drag to rotate';
  tourDevice.appendChild(tourHint);
  spinner(tourDevice, tourDevice, function () { tourPaused = true; tour.classList.add('is-paused'); clearTimeout(tourTimer); });

  showTour(0);
  if (hasIO) {
    new IntersectionObserver(function (entries) {
      tourVisible = entries[0].isIntersecting;
      if (tourVisible) showTour(tourIndex); else clearTimeout(tourTimer);
    }, { threshold: 0.4 }).observe(tour);
  }

  // Screen gallery: one block per app; tablet screens render as a bento (one large, two small)
  var phones = document.getElementById('alpengo-phones');
  var groups = [];
  ALPENGO_SCREENS.forEach(function (s) {
    var g = groups[groups.length - 1];
    if (!g || g.name !== s.group) groups.push(g = { name: s.group, kind: s.kind || 'phone', items: [] });
    g.items.push(s);
  });
  groups.forEach(function (g) {
    var block = document.createElement('div');
    block.className = 'shots';
    var label = document.createElement('p');
    label.className = 'shots__label';
    label.textContent = g.name;
    var row = document.createElement('div');
    row.className = 'shots__row shots__row--' + g.kind;
    g.items.forEach(function (s) {
      var tablet = g.kind === 'tablet';
      var fig = document.createElement('figure');
      fig.className = tablet ? 'tablet' : 'phone';
      fig.innerHTML =
        '<div class="' + fig.className + '__frame"><img loading="lazy" alt=""></div>' +
        '<figcaption class="phone__cap"><strong></strong><span></span></figcaption>';
      var img = fig.querySelector('img');
      img.width = tablet ? 1194 : 520;
      img.height = tablet ? 834 : 1125;
      img.src = 'site/img/' + (s.dir || 'alpengo') + '/' + s.file + '.webp';
      img.alt = g.name + ' — ' + s.title;
      fig.querySelector('strong').textContent = s.title;
      fig.querySelector('span').textContent = s.text;
      row.appendChild(fig);
    });
    block.appendChild(label);
    block.appendChild(row);
    phones.appendChild(block);
  });

  // Gallery and Jàng devices are spinnable models too
  document.querySelectorAll('.phone__frame, .tablet__frame, .jphone__frame').forEach(function (f) {
    var tablet = f.classList.contains('tablet__frame');
    var jang = f.classList.contains('jphone__frame');
    modelBody(f, tablet ? 7 : 9, jang ? '<span class="m3d__cams"><i></i><i></i><i></i></span><b class="m3d__word">Jàng</b>' : null, (tablet ? 'm3d__back--tablet' : '') + (jang ? ' m3d__back--jang' : ''));
    f.classList.add('m3d');
    spinner(f, f);
  });

  // Windows open smoothly as they scroll into view (scrubbed: scrolling back closes them again)
  (function () {
    var wins = [].slice.call(document.querySelectorAll('.win, .jang__panel'));
    if (!wins.length) return;
    wins.forEach(function (w) { w.classList.remove('reveal'); w.classList.add('is-in'); });
    if (reduceMotion) { wins.forEach(function (w) { w.classList.add('is-open'); }); return; }
    var queued = false;
    function update() {
      queued = false;
      var vh = window.innerHeight;
      wins.forEach(function (w) {
        var top = w.getBoundingClientRect().top;
        // closed while the window's top is at the bottom edge, fully open once it reaches ~40% of the screen
        var p = Math.min(Math.max((vh - top) / (vh * 0.6), 0), 1);
        var o = 1 - Math.pow(1 - p, 3);
        if (Math.abs((w._o || -1) - o) < 0.002) return;
        w._o = o;
        w.style.setProperty('--o', o.toFixed(4));
        w.classList.toggle('is-open', o > 0.999);
      });
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  })();

  // Every Fiverr button points to the profile
  document.querySelectorAll('[data-fiverr]').forEach(function (a) { a.href = FIVERR_URL; });

  // Magnetic final CTA
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.btn--magnetic').forEach(function (b) {
      var zone = b.parentElement;
      zone.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        var d = Math.hypot(dx, dy);
        if (d < 160) b.style.transform = 'translate(' + (dx * 0.12).toFixed(1) + 'px,' + (dy * 0.18).toFixed(1) + 'px)';
        else b.style.transform = '';
      });
      zone.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  // Header turns light over the cream Jàng panel
  var jp = document.querySelector('.jang__panel');
  if (jp && hasIO) {
    new IntersectionObserver(function (en) { nav.classList.toggle('nav--light', en[0].isIntersecting); }, { rootMargin: '0px 0px -94% 0px' }).observe(jp);
  }

  // Count-up numbers
  function countUp(el) {
    var end = +el.dataset.count, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1600, 1);
      el.textContent = Math.round(end * (0.6 + 0.4 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = Math.round(end * 0.6);
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (hasIO && !reduceMotion) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if (hasIO && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Demo videos play only while visible (not on phones / data saver)
  var videos = document.querySelectorAll('video[data-autoplay]');
  var saveData = window.matchMedia('(max-width: 760px)').matches || (navigator.connection && navigator.connection.saveData);
  if (!reduceMotion && !saveData && hasIO) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.35 });
    videos.forEach(function (v) { vo.observe(v); });
  }

  // Lightbox
  var box = document.getElementById('lightbox');
  var track = box.querySelector('.lightbox__track');
  document.querySelectorAll('[data-lightbox]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      track.innerHTML = '';
      GALLERIES[btn.dataset.lightbox].forEach(function (item) {
        var img = document.createElement('img');
        img.src = 'site/img/' + item[0] + '.webp';
        img.alt = item[1];
        track.appendChild(img);
      });
      if (box.showModal) box.showModal(); else box.setAttribute('open', '');
    });
  });
  box.querySelector('.lightbox__close').addEventListener('click', function () { box.close(); });
  box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
})();
