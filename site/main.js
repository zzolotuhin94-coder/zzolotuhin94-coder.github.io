// Portfolio page behaviour: nav, reveal-on-scroll, autoplaying demo videos, AlpenGo screens, lightbox.
(function () {
  // Link for the "Message me on Fiverr" button — replace with your Fiverr profile URL.
  var FIVERR_URL = 'https://www.fiverr.com/zolotuhindev';

  // AlpenGo screenshots: files live in site/img/alpengo/. Order = order on the page.
  var ALPENGO_SCREENS = [
    { group: 'Guest app', file: 'guest-home-night', title: 'Today in Gerlos', text: 'Weather, lifts and tonight’s events — night theme after 18:00' },
    { group: 'Guest app', file: 'guest-restaurants-night', title: 'Reserve a table', text: 'Every restaurant in the village, open-now filter' },
    { group: 'Guest app', file: 'guest-restaurant-detail-day', title: 'Restaurant page', text: 'Services, hours, reviews, call or book' },
    { group: 'Guest app', file: 'guest-booking-sheet-day', title: 'How to book', text: 'Via Fabi the AI concierge, OpenTable or e-mail' },
    { group: 'Guest app', file: 'guest-booking-calendar-day', title: 'Booking calendar', text: 'Live availability by party size and time' },
    { group: 'Guest app', file: 'guest-concierge-day', title: 'Fabi, the AI concierge', text: 'Claude-powered answers about the resort' },
    { group: 'Guest app', file: 'guest-myday-day', title: 'My Day', text: 'Personal plan with concierge tips — day theme' },
    { group: 'Guest app', file: 'guest-events-day', title: 'Events', text: 'What’s on today in Gerlos' },
    { group: 'Partner app', file: 'biz-floor-plan', title: 'Live floor plan', text: 'Free / occupied / reserved tables, overstay warnings' },
    { group: 'Partner app', file: 'biz-floor-edit', title: 'Floor-plan editor', text: 'Drag, resize and add tables, walls and the bar' },
    { group: 'Partner app', file: 'biz-floor-table-detail', title: 'Guest details', text: 'Special requests, move table, free table' },
    { group: 'Partner app', file: 'biz-home', title: 'Live dashboard', text: 'Today’s bookings and quick actions' },
    { group: 'Partner app', file: 'biz-reservations', title: 'Reservations', text: 'Filters by day, time and party size' },
    { group: 'Partner app', file: 'biz-floor-waitlist', title: 'Waitlist', text: 'Accept or decline in one tap' },
    { group: 'Partner app', file: 'biz-menu-builder', title: 'Menu builder', text: 'PDF upload, photo scan or manual dishes' },
    { group: 'Partner app', file: 'biz-reviews', title: 'Review moderation', text: 'Public replies, hide spam' },
    { group: 'Partner app', file: 'biz-rooms', title: 'Hotel rooms', text: 'Housekeeping status per room' },
    { group: 'Partner app', file: 'biz-timeline', title: 'Occupancy calendar', text: 'Rooms × days Gantt view of stays' },
    { group: 'Admin console', file: 'biz-superadmin', title: 'Command center', text: 'Sign-ups, users, tickets, live system alerts' },
    { group: 'Admin console', file: 'biz-superadmin-businesses', title: 'Businesses', text: 'Plans, modules, access, invite keys' }
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

  // AlpenGo phone screens
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
      '<div class="phone__frame"><img loading="lazy" width="520" height="1125" alt=""></div>' +
      '<figcaption class="phone__cap"><strong></strong><span></span></figcaption>';
    var img = fig.querySelector('img');
    img.src = 'site/img/alpengo/' + s.file + '.webp';
    img.alt = s.group + ' — ' + s.title;
    fig.querySelector('strong').textContent = s.title;
    fig.querySelector('span').textContent = s.text;
    phones.appendChild(fig);
  });

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Demo videos play only while visible
  var videos = document.querySelectorAll('video[data-autoplay]');
  var saveData = window.matchMedia('(max-width: 760px)').matches || (navigator.connection && navigator.connection.saveData);
  if (!reduceMotion && !saveData &&  'IntersectionObserver' in window) {
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
