// Portfolio page behaviour: nav, reveal, 3D hero parallax, product tour, counters, spotlight cards,
// AlpenGo screen gallery, autoplaying demo videos, lightbox.
(function () {
  // Link for the "Message me on Fiverr" button.
  var FIVERR_URL = 'https://www.fiverr.com/zolotuhindev';

  // Interactive tour on the AlpenGo case study (files in site/img/alpengo/).
  var TOUR = [
    { file: 'biz-floor-plan', app: 'Partner app', title: 'Live floor plan', text: 'Tables turn free, reserved or occupied the moment a booking changes — pushed over Socket.io, with overstay warnings for the host.' },
    { file: 'biz-floor-edit', app: 'Partner app', title: 'Floor-plan editor', text: 'Owners draw their own room: drag, resize and number tables, add the bar, walls and entrance.' },
    { file: 'guest-concierge-day', app: 'Guest app', title: 'Fabi, the AI concierge', text: 'Guests ask in their own language — “where can we eat fondue tonight?” — and Fabi answers from resort data through the Claude API.' },
    { file: 'guest-booking-calendar-day', app: 'Guest app', title: 'Booking in three taps', text: 'Pick a day, party size and a free slot. Availability comes from the restaurant’s own tables, so nothing is double-booked.' },
    { file: 'guest-home-night', app: 'Guest app', title: 'Today in the resort', text: 'Weather at altitude, lift status, events and recommendations. The theme follows the sky — sunrise by day, dusk after 18:00.' },
    { file: 'biz-superadmin', app: 'Admin console', title: 'Command center', text: 'The resort team sees sign-ups, users, tickets and live system alerts across every business on the platform.' }
  ];
  var TOUR_MS = 6000;

  // Full screen gallery. Order = order on the page.
  // Screen gallery: three key screens per app. Order = order on the page.
  // Add a Jang group here once its screenshots are in site/img/jang/ (use dir: 'jang').
  var ALPENGO_SCREENS = [
    { group: 'Guest app', file: 'guest-home-night', title: 'Today in the resort', text: 'Weather at altitude, lifts and tonight’s events' },
    { group: 'Guest app', file: 'guest-concierge-day', title: 'Fabi, the AI concierge', text: 'Claude-powered answers about the resort' },
    { group: 'Guest app', file: 'guest-booking-calendar-day', title: 'Booking calendar', text: 'Live availability by party size and time' },
    { group: 'Partner app', file: 'biz-floor-plan', title: 'Live floor plan', text: 'Free / occupied / reserved tables in real time' },
    { group: 'Partner app', file: 'biz-floor-edit', title: 'Floor-plan editor', text: 'Drag, resize and add tables, walls and the bar' },
    { group: 'Partner app', file: 'biz-reservations', title: 'Reservations', text: 'Today’s bookings with filters and arrival status' }
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

  // Hero: 3D phones follow the pointer
  var stage = document.querySelector('.stage__inner');
  if (stage && finePointer && !reduceMotion) {
    var hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty('--ry', (-10 + x * 18).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (6 - y * 12).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', function () {
      stage.style.removeProperty('--ry');
      stage.style.removeProperty('--rx');
    });
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
  var screens = tour.querySelector('.device__screens');
  var list = tour.querySelector('.tour__list');
  var tourIndex = 0, tourTimer = null, tourVisible = false, tourPaused = reduceMotion;
  TOUR.forEach(function (t, i) {
    var img = document.createElement('img');
    img.src = 'site/img/alpengo/' + t.file + '.webp';
    img.alt = t.app + ' — ' + t.title;
    img.width = 520; img.height = 1125;
    if (i > 0) img.loading = 'lazy';
    screens.appendChild(img);

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
  var imgs = screens.querySelectorAll('img');
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
    imgs.forEach(function (im, j) { im.classList.toggle('is-active', j === i); });
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
  showTour(0);
  if (hasIO) {
    new IntersectionObserver(function (entries) {
      tourVisible = entries[0].isIntersecting;
      if (tourVisible) showTour(tourIndex); else clearTimeout(tourTimer);
    }, { threshold: 0.4 }).observe(tour);
  }

  // AlpenGo gallery
  var phones = document.getElementById('alpengo-phones');
  var lastGroup = null;
  ALPENGO_SCREENS.forEach(function (s) {
    if (s.group !== lastGroup) {
      var label = document.createElement('span');
      label.className = 'phones__label';
      label.textContent = s.group;
      phones.appendChild(label);
      lastGroup = s.group;
    }
    var fig = document.createElement('figure');
    fig.className = 'phone';
    fig.innerHTML =
      '<div class="phone__frame"><img loading="lazy" width="520" height="1125" alt="" draggable="false"></div>' +
      '<figcaption class="phone__cap"><strong></strong><span></span></figcaption>';
    var img = fig.querySelector('img');
    img.src = 'site/img/' + (s.dir || 'alpengo') + '/' + s.file + '.webp';
    img.alt = s.group + ' — ' + s.title;
    fig.querySelector('strong').textContent = s.title;
    fig.querySelector('span').textContent = s.text;
    phones.appendChild(fig);
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
