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
    var frame = function (now) {
      if (!heroOn) { running = false; return; }
      var t = now - t0;
      cur.x += (ptr.x - cur.x) * 0.06;
      cur.y += (ptr.y - cur.y) * 0.06;
      var sp = Math.min(Math.max(window.scrollY / heroEl.offsetHeight, 0), 1);
      stage.style.setProperty('--ry', (-10 + cur.x * 16).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (6 - cur.y * 10 + sp * 14).toFixed(2) + 'deg');
      devices.forEach(function (d, i) {
        var k = ease(Math.min(Math.max((t - d._delay) / 1300, 0), 1));
        // one shared 7s rhythm, phases spread so neighbours never move toward each other at once
        var fy = Math.sin(t / 7000 * Math.PI * 2 + i * 2.1) * 9 * d._depth;
        var x = cur.x * 36 * d._depth + d._spread[0] * sp;
        var y = cur.y * 26 * d._depth + fy + d._spread[1] * sp + (1 - k) * 140;
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
      var imgs = d.querySelectorAll('.device__screen img');
      if (imgs.length > 1) {
        var i = [].indexOf.call(imgs, d.querySelector('.device__screen img.is-on'));
        imgs[i].classList.remove('is-on');
        imgs[(i + 1) % imgs.length].classList.add('is-on');
      }
      tick++;
    }, 2600);

    // Live-event toasts: at most two visible, one appears as the oldest leaves
    var toasts = document.querySelectorAll('.toast');
    var ti = 0;
    var nextToast = function () {
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
    btn.addEventListener('click', function () { tourPaused = true; tour.classList.add('is-paused'); showTour(i); });
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

  // Count-up numbers
  function countUp(el) {
    var end = +el.dataset.count, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1600, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
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
