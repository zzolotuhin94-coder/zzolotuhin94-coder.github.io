// Live prototypes: a clickable AlpenGo guest app, the partner tablet it talks to, and Fabi chat.
// Everything is simulated in the browser — no network — to show how the real product behaves.
(function () {
  var IMG = 'site/img/live/';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Delays stand for real-world latency (socket, host accepting, push) — they stay even with reduced motion;
  // only purely decorative motion (word-by-word typing, transitions) is skipped.
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var uid = 0;
  var el = function (html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  var ICON = {
    today: '<svg viewBox="0 0 24 24"><path d="M3 20 10 8l4 6 3-4 4 10z"/></svg>',
    dining: '<svg viewBox="0 0 24 24"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1-3 4-3 7h3v11"/></svg>',
    fabi: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/></svg>',
    day: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>'
  };

  var RESTAURANTS = [
    { id: 'dahuam', name: 'Dahuam.202 Restobar', rating: 4.7, near: 1, cuisine: 'Regional & international · Fondue, raclette', open: 'Open until 22:00', tags: ['Terrace', 'Fireplace', 'Kids play room'], tonight: ['Fondue evening', '19:30 · cheese fondue & raclette'], text: 'A cosy restobar-café in the heart of Gerlos, right across from the slopes — local dishes, fondue evenings and a sunny terrace.' },
    { id: 'luise', name: 'Die gute Luise', rating: 4.8, near: 2, cuisine: 'Bar · Kitchen · Pinseria', open: 'Open until 23:00', tags: ['Next to the village lift', 'Live music'], tonight: ['Live jazz', '20:30 · local trio'], text: 'Bar, kitchen and pinseria next to the village lift. Crispy Roman pinsa, Zillertal beer and live jazz on weekends.' },
    { id: 'jaeger', name: 'Jägerstüberl', rating: 4.3, near: 3, cuisine: 'Austrian · Tyrolean home cooking', open: 'Open until midnight', tags: ['Tyrolean classics', 'Stube'], tonight: ['Kaspressknödel night', 'All evening'], text: 'Classic Tyrolean Stube with Kaspressknödel, Schnitzel and Kaiserschmarrn like grandma makes it.' }
  ];
  // Decorative photos as background images: the hero's screenshot cycler (main.js) treats every <img> inside a device as a slide
  var pic = function (id) { return '<span class="ga__img" aria-hidden="true" style="background-image:url(' + IMG + id + '.webp)"></span>'; };
  var byId = function (id) { return RESTAURANTS.filter(function (r) { return r.id === id; })[0]; };

  // Event bus shared by the phone(s) and the tablet of one demo (hero and #live each get their own)
  function makeBus() {
    return {
      h: {},
      on: function (e, f) { (this.h[e] = this.h[e] || []).push(f); },
      emit: function (e, d) { (this.h[e] || []).forEach(function (f) { f(d); }); }
    };
  }

  // Scale each fixed-size UI to its frame. Tablets in a narrow frame switch to a compact layout
  // (720px base instead of 1194px: no side bar / top nav, bigger type) so they stay readable.
  var TAB_COMPACT_W = 720, TAB_COMPACT_BELOW = 560;
  function fit(screen, ui, baseW) {
    var set = function () {
      var w = screen.clientWidth;
      if (!w) return;
      var compact = baseW > 400 && w < TAB_COMPACT_BELOW;
      ui.classList.toggle('is-compact', compact);
      ui.style.setProperty('--s', w / (compact ? TAB_COMPACT_W : baseW));
    };
    set();
    if ('ResizeObserver' in window) new ResizeObserver(set).observe(screen);
    else window.addEventListener('resize', set);
  }

  /* ---------- Fabi chat ---------- */
  var QA = [
    {
      q: 'Where can we eat fondue tonight?',
      a: 'Dahuam.202 has a fondue evening tonight at 19:30 — cheese fondue, raclette and a warm fireplace, right across from the slopes. There’s still a free table for 2.',
      card: 'dahuam'
    },
    {
      q: 'Which lifts are open right now?',
      a: 'Isskogelbahn is running until 16:00. Königsleitenbahn is closed today and opens tomorrow at 09:00 — so start from Isskogel and ski back down to the village.',
      card: 'lifts'
    }
  ];

  function FabiChat(root, opts) {
    opts = opts || {};
    root.classList.add('fc');
    root.innerHTML =
      '<div class="fc__head"><span class="fc__avatar">F</span><div><strong>Fabi</strong><span>Your concierge · online</span></div></div>' +
      '<div class="fc__log" aria-live="polite"></div><div class="fc__ask"></div>';
    var log = root.querySelector('.fc__log');
    var ask = root.querySelector('.fc__ask');
    var asked = {};
    var busy = false;

    function scroll() { log.scrollTo({ top: log.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' }); }
    function bot(text) { var m = el('<div class="fc__msg fc__msg--bot"></div>'); m.textContent = text; log.appendChild(m); scroll(); return m; }

    function chips() {
      ask.innerHTML = '';
      var left = QA.filter(function (x) { return !asked[x.q]; });
      if (!left.length) {
        var again = el('<button class="fc__again" type="button">↺ Start over</button>');
        again.addEventListener('click', reset);
        ask.appendChild(again);
        return;
      }
      ask.appendChild(el('<p>Ask Fabi</p>'));
      left.forEach(function (x) {
        var b = el('<button class="fc__q" type="button"></button>');
        b.textContent = x.q;
        b.addEventListener('click', function () { send(x); });
        ask.appendChild(b);
      });
    }

    function card(kind) {
      if (kind === 'lifts') {
        return el('<div class="fc__card"><div class="fc__lift"><span>Isskogelbahn</span><b>Open · until 16:00</b></div>' +
          '<div class="fc__lift"><span>Königsleitenbahn</span><b class="is-closed">Closed · opens 09:00</b></div>' +
          '<div class="fc__lift"><span>Übungslift Gerlos</span><b>Open</b></div></div>');
      }
      var r = byId(kind);
      var c = el('<div class="fc__card">' + pic(r.id) + '<div class="fc__cardb"><strong>' + r.name +
        '<span>★ ' + r.rating + '</span></strong><p>' + r.tonight[0] + ' · ' + r.tonight[1] + '</p>' +
        '<button class="ga__btn ga__btn--gold" type="button">Book a table · 19:30</button></div></div>');
      var btn = c.querySelector('button');
      btn.addEventListener('click', function () {
        if (opts.onBook) opts.onBook(r, btn);
      });
      return c;
    }

    async function send(x) {
      if (busy) return;
      busy = true;
      asked[x.q] = true;
      ask.innerHTML = '';
      var me = el('<div class="fc__msg fc__msg--me"></div>');
      me.textContent = x.q;
      log.appendChild(me); scroll();
      await wait(450);
      var typing = el('<div class="fc__msg fc__msg--bot fc__typing"><i></i><i></i><i></i></div>');
      log.appendChild(typing); scroll();
      await wait(1100);
      typing.remove();
      var m = bot('');
      var words = reduceMotion ? [x.a] : x.a.split(' ');
      for (var i = 0; i < words.length; i++) {
        m.textContent += (i ? ' ' : '') + words[i];
        if (i % 3 === 0) scroll();
        if (!reduceMotion) await wait(38);
      }
      await wait(250);
      log.appendChild(card(x.card)); scroll();
      await wait(400);
      busy = false;
      chips();
    }

    function reset() {
      asked = {};
      log.innerHTML = '';
      bot('Hi, I’m Fabi — your digital concierge. Ask me anything about Gerlos: restaurants, lifts or what’s on tonight.');
      chips();
    }
    reset();
    return { reset: reset };
  }

  /* ---------- Guest app ---------- */
  function GuestApp(ui, bus) {
    ui.classList.add('ga');
    var state = { tab: 0, bookings: [], guests: 2, slot: '19:30', rest: null };
    ui.innerHTML =
      '<div class="ga__island"></div><div class="ga__status"><span>19:32</span><span>5G <i></i></span></div>' +
      '<div class="ga__views"></div>' +
      '<button class="ga__fab" type="button" aria-label="Ask Fabi">' + ICON.chat + '</button>' +
      '<nav class="ga__tabs"><span class="ga__tabpill"></span>' +
      ['Today:today', 'Dining:dining', 'Fabi:fabi', 'My Day:day'].map(function (t, i) {
        var p = t.split(':');
        return '<button class="ga__tab' + (i ? '' : ' is-on') + '" type="button" data-tab="' + i + '">' + ICON[p[1]] + p[0] + '</button>';
      }).join('') + '</nav>' +
      '<div class="ga__scrim"></div><div class="ga__sheet" tabindex="-1" aria-hidden="true" inert></div>' +
      '<div class="ga__push" role="status"></div>';

    var views = ui.querySelector('.ga__views');
    var sheet = ui.querySelector('.ga__sheet');
    var scrim = ui.querySelector('.ga__scrim');
    var push = ui.querySelector('.ga__push');
    var pill = ui.querySelector('.ga__tabpill');
    var tabs = ui.querySelectorAll('.ga__tab');
    var tabbar = ui.querySelector('.ga__tabs');
    var fab = ui.querySelector('.ga__fab');
    var current = null;

    function header(title) {
      return '<div class="ga__top"><span class="ga__brand"><b>A</b>ALPENGO</span><span class="ga__icons"><span>' + ICON.bell + '</span><span>' + ICON.user + '</span></span></div><h2>' + title + '</h2>';
    }

    var screens = {
      today: function () {
        var v = el('<section class="ga__view">' + header('Welcome to Gerlos') +
          '<div class="ga__card ga__weather"><div class="ga__wtop"><span>📍 <b>Gerlos, Zillertal</b> · 1247 m</span><span>Mon, 28 Sep</span></div>' +
          '<div class="ga__temp">12<sup>°C</sup></div><div class="ga__wmeta">Feels like 9° · Wind 7 km/h · clear evening</div>' +
          '<div class="ga__wrow"><button class="ga__lifts" type="button"><strong>1/2</strong>Lifts open</button><div><strong>18:52</strong>Sunset</div><div><strong>0 cm</strong>Fresh snow</div></div></div>' +
          '<div class="ga__chips"><button class="ga__chip is-on" type="button" data-go="1">🍴 Food &amp; Drink</button><button class="ga__chip" type="button">♨ Wellness</button><button class="ga__chip" type="button">🧸 Kids</button><button class="ga__chip" type="button" data-go="3">★ My Day</button></div>' +
          '<h3>Tonight in Gerlos <small>See all</small></h3><div class="ga__card">' +
          '<button class="ga__event" type="button" data-rest="dahuam"><time>19:30</time><span>Fondue evening<small>Dahuam.202 Restobar</small></span><em>›</em></button>' +
          '<button class="ga__event" type="button" data-rest="luise"><time>20:30</time><span>Live jazz<small>Die gute Luise</small></span><em>›</em></button>' +
          '<button class="ga__event" type="button" data-rest="jaeger"><time>21:00</time><span>Kaspressknödel night<small>Jägerstüberl</small></span><em>›</em></button></div></section>');
        v.querySelector('.ga__lifts').addEventListener('click', liftSheet);
        v.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { goTab(+b.dataset.go); }); });
        v.querySelectorAll('[data-rest]').forEach(function (b) { b.addEventListener('click', function () { openDetail(b.dataset.rest); }); });
        return v;
      },
      dining: function () {
        var v = el('<section class="ga__view">' + header('Reserve a table') +
          '<div class="ga__sort"><button class="ga__chip is-on" type="button" data-sort="near">Nearby</button><button class="ga__chip" type="button" data-sort="rating">Top rated</button></div><div class="ga__list"></div></section>');
        var list = v.querySelector('.ga__list');
        RESTAURANTS.forEach(function (r) {
          var c = el('<button class="ga__card ga__rest" type="button">' + pic(r.id) + '<div><strong>' + r.name + '<span>★ ' + r.rating + '</span></strong><p>' + r.cuisine + '</p><span class="ga__open">' + r.open + '</span><span class="ga__pill">Book</span></div></button>');
          c.dataset.id = r.id;
          c.addEventListener('click', function () { openDetail(r.id); });
          list.appendChild(c);
        });
        v.querySelectorAll('[data-sort]').forEach(function (b) {
          b.addEventListener('click', function () {
            v.querySelectorAll('[data-sort]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
            sortList(list, b.dataset.sort);
          });
        });
        return v;
      },
      fabi: function () {
        var v = el('<section class="ga__view" style="padding-bottom:104px"><div class="fc-host" style="height:100%"></div></section>');
        // Fabi suggested "a free table for 2 at 19:30" — the booking sheet opens with exactly that
        FabiChat(v.querySelector('.fc-host'), { onBook: function (r) { openBooking(r.id, '19:30', 2); } });
        return v;
      },
      day: function () {
        var list = state.bookings.slice().sort(function (a, c) { return a.time < c.time ? -1 : a.time > c.time ? 1 : a.n - c.n; });
        var v = el('<section class="ga__view">' + header('Hello, <span style="color:var(--g-gold)">Guest</span>') +
          '<div class="ga__card ga__rec"><small>YOUR RECOMMENDATION FOR NOW</small><p>The sun sets at 18:52 — the terrace at Dahuam.202 is the warmest seat in the village.</p><span>— your concierge, Fabi</span></div>' +
          '<h3>Your day today</h3><div class="ga__tl">' +
          '<div class="ga__card ga__tli is-done"><time>09:00</time><strong>Breakfast in the hotel</strong><small>Done</small></div>' +
          '<div class="ga__card ga__tli is-done"><time>10:30</time><strong>Isskogelbahn — first run</strong><small>Done</small></div>' +
          (list.length ? list.map(function (b) {
            return '<div class="ga__card ga__tli' + (b.seen ? '' : ' is-new') + '"><time>' + b.time + '</time><strong>Dinner at ' + b.rest.name + '</strong><small>Table ' + (b.table || '—') + ' · ' + b.guests + ' guest' + (b.guests === 1 ? '' : 's') + ' · ' + (b.ok ? 'confirmed ✓' : 'waiting for the host…') + '</small></div>';
          }).join('') + '<button class="ga__card ga__tli ga__tli--add" type="button" data-go="1"><time>Tonight</time><strong>Add another reservation</strong><small style="color:var(--g-gold)">Reserve a table ›</small></button>'
            : '<button class="ga__card ga__tli" type="button" data-go="1" style="width:100%;text-align:left"><time>19:30</time><strong>Dinner — no table yet</strong><small style="color:var(--g-gold)">Reserve a table ›</small></button>') +
          '</div></section>');
        var go = v.querySelector('[data-go]');
        if (go) go.addEventListener('click', function () { goTab(1); });
        state.bookings.forEach(function (b) { b.seen = true; });
        v.dataset.screen = 'day';
        return v;
      }
    };
    var ORDER = ['today', 'dining', 'fabi', 'day'];

    // iOS-style transitions: 'tab' = soft crossfade, 'push' = detail slides in over a dimmed parallax,
    // 'pop' = the reverse. Reduced motion swaps instantly.
    var T_MS = { tab: 420, push: 480, pop: 480 };
    var T_CLS = ['t-tab-in', 't-tab-out', 't-push-in', 't-push-out', 't-pop-in', 't-pop-out'];
    function show(next, kind) {
      var prev = current;
      // a transition still running: drop views that are already on their way out
      [].slice.call(views.children).forEach(function (n) { if (n !== prev) n.remove(); });
      views.appendChild(next);
      current = next;
      if (!prev) return;
      if (reduceMotion || !T_MS[kind]) { prev.remove(); return; }
      T_CLS.forEach(function (c) { prev.classList.remove(c); });
      prev.inert = true;
      next.classList.add('t-' + kind + '-in', 'is-anim');
      prev.classList.add('t-' + kind + '-out', 'is-anim');
      setTimeout(function () {
        prev.remove();
        next.classList.remove('t-' + kind + '-in', 'is-anim');
      }, T_MS[kind] + 40);
    }

    // Re-render My Day in place when a booking changes while it is on screen
    function refreshDay() {
      if (!current || current.dataset.screen !== 'day' || current.classList.contains('is-anim')) return;
      var top = current.scrollTop;
      var next = screens.day();
      views.replaceChild(next, current);
      current = next;
      next.scrollTop = top;
    }

    function goTab(i) {
      closeSheet();
      var fromDetail = !!(current && current.classList.contains('ga__view--detail'));
      if (i === state.tab && !fromDetail) return;
      state.tab = i;
      tabs.forEach(function (t, j) { t.classList.toggle('is-on', j === i); });
      ui.classList.toggle('is-fabi', i === 2);
      pill.style.transform = 'translateX(' + (i * 100) + '%)';
      show(screens[ORDER[i]](), fromDetail ? 'pop' : 'tab');
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { goTab(+t.dataset.tab); }); });
    fab.addEventListener('click', function () { goTab(2); });

    function openDetail(id) {
      var r = byId(id);
      var v = el('<section class="ga__view ga__view--detail"><div class="ga__hero">' + pic(r.id) + '</div>' +
        '<button class="ga__back" type="button" aria-label="Back">' + ICON.back + '</button>' +
        '<div class="ga__dbody"><h2>' + r.name + '</h2><div class="ga__rating"><b>★ ' + r.rating + '</b> · ' + r.cuisine + '</div>' +
        '<div class="ga__tags">' + r.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div><p>' + r.text + '</p>' +
        '<div class="ga__card ga__tonight"><b>★</b><span><strong>Tonight: ' + r.tonight[0] + '</strong>' + r.tonight[1] + '</span></div>' +
        '<div class="ga__actions"><button class="ga__btn" type="button">Call</button><button class="ga__btn ga__btn--gold" type="button" data-book>Book a table</button></div></div></section>');
      v.querySelector('.ga__back').addEventListener('click', function () { goTab(state.tab); });
      v.querySelector('[data-book]').addEventListener('click', function () { openBooking(r.id); });
      show(v, 'push');
    }

    function sortList(list, by) {
      var items = [].slice.call(list.children);
      var first = {};
      items.forEach(function (n) { first[n.dataset.id] = n.getBoundingClientRect().top; });
      items.sort(function (a, b) {
        var ra = byId(a.dataset.id), rb = byId(b.dataset.id);
        return by === 'rating' ? rb.rating - ra.rating : ra.near - rb.near;
      }).forEach(function (n) { list.appendChild(n); });
      if (reduceMotion || !Element.prototype.animate) return;
      var scale = parseFloat(ui.style.getPropertyValue('--s')) || 1;
      items.forEach(function (n) {
        var dy = (first[n.dataset.id] - n.getBoundingClientRect().top) / scale;
        n.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
    }

    /* Sheets */
    // The sheet is inert while closed (not focusable, not announced); while open, the app behind it is inert.
    var opener = null, sheetOpen = false;
    var behind = function (v) { [views, tabbar, fab].forEach(function (n) { n.inert = v; }); };
    function openSheet(html, label, kind) {
      sheet.innerHTML = '<div class="ga__handle"></div>' + html;
      sheet.setAttribute('aria-label', label || 'Details');
      sheet.dataset.kind = kind || '';
      delete sheet.dataset.booking;
      if (!sheetOpen) opener = document.activeElement;
      sheetOpen = true;
      sheet.inert = false;
      sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.removeAttribute('aria-hidden');
      behind(true);
      focusSheet();
      requestAnimationFrame(function () { sheet.classList.add('is-on'); scrim.classList.add('is-on'); });
    }
    function focusSheet() {
      // only move focus if the visitor is working inside this app (a mouse click elsewhere shouldn't be hijacked)
      if (!ui.contains(document.activeElement) && document.activeElement !== document.body) return;
      var f = sheet.querySelector('button:not([disabled])') || sheet;
      f.focus({ preventScroll: true });
    }
    function closeSheet() {
      if (!sheetOpen) return;
      sheetOpen = false;
      var hadFocus = sheet.contains(document.activeElement);
      sheet.classList.remove('is-on'); scrim.classList.remove('is-on');
      sheet.inert = true;
      sheet.removeAttribute('role'); sheet.removeAttribute('aria-modal'); sheet.setAttribute('aria-hidden', 'true');
      behind(false);
      if (hadFocus) {
        var back = opener && opener.isConnected && ui.contains(opener) ? opener : (current && current.querySelector('button')) || tabs[state.tab];
        if (back) back.focus({ preventScroll: true });
      }
      opener = null;
    }
    scrim.addEventListener('click', closeSheet);
    ui.addEventListener('keydown', function (e) {
      if (!sheetOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); closeSheet(); return; }
      if (e.key === 'Tab' && (sheet.contains(document.activeElement))) { // modal: keep focus inside the sheet
        var f = [].slice.call(sheet.querySelectorAll('button:not([disabled])'));
        var i = f.indexOf(document.activeElement);
        if (!f.length) { e.preventDefault(); return; }
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus({ preventScroll: true }); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus({ preventScroll: true }); }
      }
    });

    function liftSheet() {
      openSheet('<h4>Lift status · Gerlos</h4><p>Live from the lift operators · updated 19:30</p>' +
        '<div class="ga__lift"><i></i><span>Isskogelbahn</span><small>Open · until 16:00</small></div>' +
        '<div class="ga__lift is-closed"><i></i><span>Königsleitenbahn</span><small>Closed · opens 09:00</small></div>' +
        '<div class="ga__lift"><i></i><span>Übungslift Gerlos</span><small>Open · until 16:30</small></div>' +
        '<button class="ga__acc" type="button" aria-expanded="false">Season 2026/27 hours</button><div class="ga__accbody">Winter season from 5 December to 11 April. First lift 08:30, last ascent 16:00. Night skiing on Thursdays until 21:00.</div>', 'Lift status');
      var acc = sheet.querySelector('.ga__acc');
      acc.addEventListener('click', function () { acc.setAttribute('aria-expanded', acc.getAttribute('aria-expanded') !== 'true'); });
    }

    function openBooking(id, slot, guests) {
      var r = byId(id);
      state.rest = r;
      if (slot) state.slot = slot;
      if (guests) state.guests = guests;
      var slots = ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
      openSheet('<h4>Book a table</h4><p>' + r.name + ' · Today, 28 Sep</p>' +
        '<div class="ga__label">Guests</div><div class="ga__stepper"><button type="button" data-g="-1">−</button><strong><span data-guests>' + state.guests + '</span> guests</strong><button type="button" data-g="1">+</button></div>' +
        '<div class="ga__label">Available times</div><div class="ga__slots">' + slots.map(function (s) {
          return '<button class="ga__slot' + (s === state.slot ? ' is-on' : '') + '" type="button"' + (s === '19:00' ? ' disabled' : '') + '>' + s + '</button>';
        }).join('') + '</div><button class="ga__btn ga__btn--gold ga__confirm" type="button"></button>', 'Book a table', 'book');
      var confirm = sheet.querySelector('.ga__confirm');
      var label = function () { confirm.textContent = 'Confirm · ' + state.guests + ' guests · ' + state.slot; };
      label();
      sheet.querySelectorAll('[data-g]').forEach(function (b) {
        b.addEventListener('click', function () {
          state.guests = Math.min(8, Math.max(1, state.guests + +b.dataset.g));
          sheet.querySelector('[data-guests]').textContent = state.guests;
          label();
        });
      });
      sheet.querySelectorAll('.ga__slot:not([disabled])').forEach(function (b) {
        b.addEventListener('click', function () {
          sheet.querySelectorAll('.ga__slot').forEach(function (x) { x.classList.toggle('is-on', x === b); });
          state.slot = b.textContent; label();
        });
      });
      confirm.addEventListener('click', async function () {
        var sheetWasFocused = sheet.contains(document.activeElement);
        confirm.disabled = true; // (a disabled button drops focus — it goes back to the sheet below)
        confirm.setAttribute('aria-label', 'Sending');
        confirm.innerHTML = '<span class="ga__spin"></span>';
        if (sheetWasFocused) sheet.focus({ preventScroll: true });
        await wait(700);
        if (!sheetOpen || sheet.dataset.kind !== 'book' || !sheet.contains(confirm)) return; // closed meanwhile
        var b = { id: 'b' + (++uid), n: uid, rest: r, guests: state.guests, time: state.slot, ok: false };
        state.bookings.push(b);
        sheet.innerHTML = '<div class="ga__handle"></div><div class="ga__done"><svg class="ga__check" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36"/><path d="M25 41l10 10 20-22"/></svg>' +
          '<h4>Request sent</h4><p>' + r.name + ' · Today ' + b.time + ' · ' + b.guests + ' guest' + (b.guests === 1 ? '' : 's') + '</p><div class="ga__wait" role="status">● Waiting for the restaurant to confirm…</div></div>';
        sheet.setAttribute('aria-label', 'Request sent');
        sheet.dataset.kind = 'done';
        sheet.dataset.booking = b.id;
        if (sheetWasFocused || document.activeElement === document.body) sheet.focus({ preventScroll: true });
        refreshDay();
        bus.emit('booking', b);
      });
    }

    var doneShowing = function (b) { return sheetOpen && sheet.dataset.kind === 'done' && sheet.dataset.booking === b.id; };
    bus.on('accepted', async function (d) {
      var b = d.booking;
      if (state.bookings.indexOf(b) < 0 || b.ok) return; // someone else's booking
      b.ok = true;
      b.table = d.table;
      if (doneShowing(b)) {
        var w = sheet.querySelector('.ga__wait');
        if (w) { w.textContent = '✓ Confirmed · Table ' + d.table; w.classList.add('is-ok'); }
      }
      refreshDay();
      push.innerHTML = '<b>AG</b><span><strong>Reservation confirmed ✓</strong>' + b.rest.name + ' · Table ' + d.table + ' is ready at ' + b.time + '</span>';
      push.classList.add('is-on');
      var mine = push.dataset.b = b.id;
      await wait(3600);
      if (push.dataset.b === mine) push.classList.remove('is-on');
      await wait(300);
      // only move on if the visitor is still looking at this booking's confirmation
      if (!doneShowing(b)) return;
      closeSheet();
      goTab(3);
    });

    show(screens.today());
  }

  /* ---------- Partner tablet ---------- */
  // One tablet per restaurant: each venue keeps its own floor plan, bookings and positions; a booking brings its venue on screen.
  // All views (dashboard, floor plan, bookings, analytics) read the same booking list, so every action shows up everywhere.
  var LOGO = '<svg viewBox="0 0 32 32"><path d="M3 27 14 5l6 12M9 27l11-17 9 17M14 21h11"/></svg>';
  var PI = {
    home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
    floor: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    book: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    stats: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.300-5.500 6.5-5.500s5.700 2 6.500 5.500"/><path d="M16 4.600a3.500 3.500 0 0 1 0 6.800M18 14.800c2 .7 3.200 2.500 3.600 5.200"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    move: '<svg viewBox="0 0 24 24"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>',
    exit: '<svg viewBox="0 0 24 24"><path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M10 16l-4-4 4-4M6 12h10"/></svg>',
    check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.500l2.800 2.800L16 10"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    glass: '<svg viewBox="0 0 24 24"><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    seat: '<svg viewBox="0 0 24 24"><path d="M7 21v-6h10v6M6 15V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10"/></svg>',
    walk: '<svg viewBox="0 0 24 24"><circle cx="13" cy="4" r="2"/><path d="M9 21l2-6 3 3v3M8 12l3-4 4 2 2 3M11 8l-1 5"/></svg>',
    app: '<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2.500"/><path d="M11 18h2"/></svg>',
    cake: '<svg viewBox="0 0 24 24"><path d="M4 21h16v-8H4zM4 16c2 1.500 4 1.500 6 0s4-1.500 6 0 3 1.500 4 0M12 13V9M12 6.500c-1 0-1.500-.8-1-2L12 3l1 1.500c.5 1.200 0 2-1 2"/></svg>',
    leaf: '<svg viewBox="0 0 24 24"><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8"/></svg>',
    drop: '<svg viewBox="0 0 24 24"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/></svg>',
    baby: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M12 8v6M8 10l4 2 4-2M9 21l3-7 3 7"/></svg>',
    win: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1.500"/><path d="M12 3v18M4 12h16"/></svg>'
  };
  var REQ = { 'Gluten-free': 'leaf', 'Lactose-free': 'drop', 'High chair': 'baby', 'Birthday': 'cake', 'Window seat': 'win', 'Vegetarian': 'leaf', 'Anniversary': 'cake' };
  var VIEWS = [['dash', 'Dashboard', 'Home', 'home'], ['floor', 'Floor plan', 'Floor', 'floor'], ['book', 'Bookings', 'Bookings', 'book'], ['stats', 'Analytics', 'Stats', 'stats']];
  var PLAN_W = 680, PLAN_H = 580, GRID = 20;
  var LAYOUT = [
    { n: 1, seats: 2, x: 40, y: 60, w: 100, h: 100, round: 1 }, { n: 2, seats: 2, x: 180, y: 60, w: 100, h: 100, round: 1 },
    { n: 3, seats: 4, x: 320, y: 60, w: 160, h: 100 }, { n: 4, seats: 4, x: 520, y: 60, w: 140, h: 100 },
    { n: 5, seats: 2, x: 40, y: 200, w: 100, h: 100, round: 1 }, { n: 6, seats: 6, x: 180, y: 200, w: 220, h: 100 },
    { n: 7, seats: 2, x: 440, y: 200, w: 100, h: 100, round: 1 }, { n: 8, seats: 4, x: 580, y: 200, w: 80, h: 180 },
    { n: 9, seats: 4, x: 40, y: 340, w: 160, h: 100 }, { n: 10, seats: 2, x: 240, y: 340, w: 100, h: 100, round: 1 },
    { n: 11, seats: 4, x: 380, y: 340, w: 160, h: 100 }, { n: 12, seats: 8, x: 40, y: 480, w: 300, h: 80 }
  ];
  // [name, time, guests, a(rrived)/c(onfirmed)/w(aiting), table, requests]
  var VENUES = {
    dahuam: { past: [42, 51, 38, 57, 64, 71], pastB: [14, 17, 12, 19, 22, 24], pastApp: [4, 6, 3, 7, 9, 11], list: [
      ['Familie Hofer', '18:00', 4, 'a', 3, ['High chair']], ['Lukas Gruber', '18:30', 2, 'a', 1, []], ['Markus Wagner', '18:45', 6, 'a', 6, ['Birthday']],
      ['Eva Lechner', '19:10', 2, 'a', 10, ['Vegetarian']], ['Sophie Pichler', '19:45', 2, 'c', 2, ['Window seat']], ['Anna Berger', '20:00', 4, 'c', 4, ['Gluten-free', 'Lactose-free', 'Birthday']],
      ['Julia Steiner', '20:15', 4, 'w', 0, ['High chair']], ['Felix Moser', '20:30', 3, 'w', 0, []], ['Paul Egger', '21:00', 3, 'c', 11, ['Anniversary']]] },
    luise: { past: [55, 49, 61, 58, 77, 84], pastB: [18, 16, 20, 19, 25, 27], pastApp: [6, 5, 8, 7, 11, 13], list: [
      ['Ski club Gerlos', '18:00', 8, 'a', 12, ['Vegetarian']], ['Jonas Keller', '18:30', 2, 'a', 2, []], ['Sophie Maier', '18:45', 4, 'a', 4, ['Gluten-free']],
      ['Tim Rainer', '19:15', 2, 'a', 7, []], ['Lena Fischer', '20:30', 4, 'c', 3, ['Birthday']], ['Nina Brandl', '20:45', 2, 'w', 0, ['Window seat']], ['Max Huber', '21:00', 3, 'c', 9, []]] },
    jaeger: { past: [36, 40, 33, 45, 52, 60], pastB: [11, 13, 10, 15, 17, 19], pastApp: [3, 4, 2, 5, 6, 8], list: [
      ['Familie Gruber', '18:15', 4, 'a', 3, ['High chair', 'Lactose-free']], ['Clara Winkler', '18:40', 2, 'a', 5, []], ['Stefan Pichler', '19:00', 4, 'a', 8, []],
      ['Wanderverein', '20:00', 6, 'c', 6, ['Vegetarian']], ['Georg Mair', '20:15', 2, 'w', 0, []], ['Ida Steiner', '21:30', 2, 'c', 10, ['Anniversary']]] }
  };
  var ST = { waiting: 'Waiting', confirmed: 'Confirmed', arrived: 'Arrived', done: 'Left', cancelled: 'Cancelled' };
  var NEW_NAMES = ['Maria Kofler', 'Thomas Huber', 'David Bauer', 'Laura Egger', 'Florian Moser', 'Katrin Wurm', 'Jakob Rieder'];
  var initials = function (s) { return s.split(/[\s(]+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); };
  var phoneOf = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9000000; return '+43 660 ' + String(1000000 + h).slice(0, 3) + ' ' + String(1000000 + h).slice(3); };

  function venueState(id) {
    var v = VENUES[id] || VENUES.dahuam;
    var bid = 0;
    return {
      id: id, meta: v, walkins: 0,
      tables: LAYOUT.map(function (t) { return { n: t.n, seats: t.seats, x: t.x, y: t.y, w: t.w, h: t.h, round: t.round, blocked: false }; }),
      bookings: v.list.map(function (r) {
        return { id: id + (++bid), name: r[0], time: r[1], guests: r[2], status: { a: 'arrived', c: 'confirmed', w: 'waiting' }[r[3]], table: r[4] || null, reqs: r[5], src: 'phone' };
      })
    };
  }

  function PartnerTablet(ui, bus) {
    ui.classList.add('pt');
    var navBtns = VIEWS.map(function (v, i) {
      return '<button class="pt__tab' + (i === 1 ? ' is-on' : '') + '" type="button" data-go="' + v[0] + '"' + (i === 1 ? ' aria-current="page"' : '') + '><span class="pt__full">' + v[1] + '</span><span class="pt__short">' + v[2] + '</span>' + (v[0] === 'book' ? '<i class="pt__badge" data-badge hidden></i>' : '') + '</button>';
    }).join('');
    ui.innerHTML =
      '<aside class="pt__side"><span class="pt__logo" aria-hidden="true">' + LOGO + '</span>' +
      VIEWS.map(function (v, i) { return '<button class="pt__sbtn' + (i === 1 ? ' is-on' : '') + '" type="button" data-go="' + v[0] + '" aria-label="' + v[1] + '" tabindex="-1">' + PI[v[3]] + '</button>'; }).join('') +
      '<span class="pt__sgap"></span><span class="pt__sbtn pt__sbtn--dim" aria-hidden="true">' + PI.gear + '</span></aside>' +
      '<div class="pt__main"><div class="pt__bar"><div class="pt__brand"><span class="pt__blogo" aria-hidden="true">' + LOGO + '</span><div><strong>AlpenGO Business</strong><small data-venue></small></div></div>' +
      '<nav class="pt__nav" aria-label="Partner app">' + navBtns + '<span class="pt__ink" aria-hidden="true"></span></nav>' +
      '<div class="pt__right"><span class="pt__live"><i></i>Live</span><span class="pt__bell" aria-hidden="true">' + ICON.bell + '</span></div></div>' +
      '<div class="pt__stage">' +
        '<section class="pt__view pt__view--dash" data-view="dash" hidden></section>' +
        '<section class="pt__view pt__view--floor is-cur" data-view="floor"></section>' +
        '<section class="pt__view pt__view--book" data-view="book" hidden></section>' +
        '<section class="pt__view pt__view--stats" data-view="stats" hidden></section>' +
        '<div class="pt__toast" role="status"></div>' +
      '</div></div>' +
      '<div class="pt__scrim"></div><div class="pt__modal" tabindex="-1" aria-hidden="true" inert></div>';

    var $ = function (s, r) { return (r || ui).querySelector(s); };
    var $$ = function (s, r) { return [].slice.call((r || ui).querySelectorAll(s)); };
    var stage = $('.pt__stage'), toast = $('.pt__toast'), modal = $('.pt__modal'), scrim = $('.pt__scrim');
    var viewEl = {}; $$('.pt__view').forEach(function (s) { viewEl[s.dataset.view] = s; });
    var nav = $('.pt__nav'), ink = $('.pt__ink');

    /* ----- Floor view scaffold ----- */
    viewEl.floor.innerHTML =
      '<div class="pt__tools"><span class="pt__clock">' + PI.clock + '19:32</span>' +
      '<div class="pt__seg" role="group" aria-label="Mode"><span class="pt__segpill" aria-hidden="true"></span><button type="button" class="is-on" data-mode="seat" aria-pressed="true">' + PI.seat + '<span class="pt__full">Seating mode</span><span class="pt__short">Seating</span></button><button type="button" data-mode="config" aria-pressed="false">' + PI.gear + '<span class="pt__full">Configure</span><span class="pt__short">Configure</span></button></div>' +
      '<span class="pt__occ">' + PI.stats + '<b data-occ></b> full</span>' +
      '<button class="pt__cta" type="button" data-new>' + PI.plus + '<span class="pt__full">New reservation</span><span class="pt__short">New</span></button>' +
      '<button class="pt__cta pt__cta--add" type="button" data-add>' + PI.plus + 'Add table</button></div>' +
      '<div class="pt__body"><div class="pt__list">' +
        '<div class="pt__sec"><span>Waiting</span><span data-wcount>0</span></div><div class="pt__wait" data-waiting></div>' +
        '<div class="pt__sec"><span>Tonight</span><span data-tcount>0</span></div><div class="pt__tonight" data-tonight></div></div>' +
      '<div class="pt__floor"><div class="pt__legend"><span class="l-free">Free</span><span class="l-occ">Occupied</span><span class="l-res">Reserved</span></div>' +
      '<p class="pt__hint">Drag tables to move them · arrow keys nudge · snaps to the grid</p>' +
      '<div class="pt__pick" role="status"></div><div class="pt__plan"></div></div></div>';
    var floor = $('.pt__floor'), plan = $('.pt__plan'), pickBar = $('.pt__pick');
    var waitingEl = $('[data-waiting]'), tonightEl = $('[data-tonight]');

    /* ----- Dashboard scaffold ----- */
    viewEl.dash.innerHTML =
      '<div class="pt__page"><header class="pt__head"><div><small>Monday, 28 September</small><h2>Overview</h2><p>Live figures for <span data-venue></span></p></div><span class="pt__open"><i></i>Open · until 23:00</span></header>' +
      '<div class="pt__dgrid"><div class="pt__card pt__hero"><span class="pt__lbl">Bookings today</span><div class="pt__big" data-k="total">0</div>' +
        '<div class="pt__stack" data-k="stack"><i class="s-arr"></i><i class="s-con"></i><i class="s-wai"></i></div>' +
        '<div class="pt__keys"><span class="k-arr"><b data-k="arr">0</b> arrived</span><span class="k-con"><b data-k="con">0</b> confirmed</span><span class="k-wai"><b data-k="wai">0</b> waiting</span></div></div>' +
      '<div class="pt__card pt__hours"><span class="pt__lbl">Arrivals by hour</span><div class="pt__hbars" data-k="hours"></div></div></div>' +
      '<div class="pt__card pt__quick"><button type="button" data-q="new"><span class="q-cyan">' + PI.plus + '</span>New reservation</button><button type="button" data-q="wait"><span class="q-amber">' + PI.glass + '</span>Open waitlist</button><button type="button" data-q="block"><span class="q-rust">' + PI.lock + '</span>Block tables</button></div>' +
      '<div class="pt__tiles"><div class="pt__card pt__tile"><span class="t-ico q-cyan">' + PI.users + '</span><div><b data-k="guests">0</b><span>Guests tonight</span></div><svg class="pt__spark" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true"><path class="sp-a" d=""/><path class="sp-l" d=""/><circle r="3"/></svg></div>' +
        '<div class="pt__card pt__tile"><span class="t-ico q-mint">' + PI.floor + '</span><div><b data-k="occ">0%</b><span>Occupancy · <em data-k="occn"></em></span></div><div class="pt__meter"><i data-k="occbar"></i></div></div>' +
        '<div class="pt__card pt__tile"><span class="t-ico q-amber">' + PI.clock + '</span><div><b data-k="wai2" class="c-amber">0</b><span>Waiting for confirmation</span></div></div></div>' +
      '<div class="pt__card pt__next"><div class="pt__ctitle"><span class="pt__lbl">Next arrivals</span><button type="button" class="pt__link" data-go="book">All bookings ›</button></div><div data-next></div></div></div>';

    /* ----- Bookings scaffold ----- */
    viewEl.book.innerHTML =
      '<div class="pt__page pt__page--wide"><header class="pt__bhead"><h2>Today · 28 Sep <span class="pt__wchip" data-bwait></span></h2><div class="pt__filters" role="group" aria-label="Filter bookings">' +
      [['all', 'All'], ['waiting', 'Waiting'], ['confirmed', 'Confirmed'], ['arrived', 'Arrived']].map(function (f, i) {
        return '<button type="button" data-f="' + f[0] + '" aria-pressed="' + !i + '"' + (i ? '' : ' class="is-on"') + '>' + f[1] + ' <em></em></button>';
      }).join('') + '</div></header><div class="pt__cards" data-cards></div></div>';
    var cardsEl = $('[data-cards]');

    /* ----- Analytics scaffold ----- */
    var DAYS = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Today'];
    viewEl.stats.innerHTML =
      '<div class="pt__page pt__page--wide"><header class="pt__head"><div><small>Last 7 days</small><h2>Analytics</h2></div><span class="pt__range">22 – 28 Sep ▾</span></header>' +
      '<div class="pt__kpis"><div class="pt__card"><span class="pt__lbl">Covers</span><b data-k="s-cov"></b><em class="up">▲ 12% vs last week</em></div>' +
        '<div class="pt__card"><span class="pt__lbl">Bookings</span><b data-k="s-bk"></b><em class="up">▲ 8%</em></div>' +
        '<div class="pt__card"><span class="pt__lbl">Avg. party</span><b data-k="s-avg"></b><em>guests per table</em></div>' +
        '<div class="pt__card"><span class="pt__lbl">Via AlpenGo app</span><b data-k="s-app"></b><em class="up">▲ 5 pts</em></div></div>' +
      '<div class="pt__sgrid"><div class="pt__card pt__chart"><div class="pt__ctitle"><span class="pt__lbl">Covers per evening</span><span class="pt__cnote"><i></i>today, live</span></div>' +
        '<div class="pt__plot"><div class="pt__gl" data-k="gl"></div><div class="pt__cols">' + DAYS.map(function (d, i) {
          return '<div class="pt__col' + (i === 6 ? ' is-today' : '') + '"><span class="pt__val"></span><i class="pt__barv"></i><small>' + d + '</small></div>';
        }).join('') + '</div></div></div>' +
      '<div class="pt__card pt__chan"><span class="pt__lbl">Booking channels</span><div class="pt__hstack" data-k="chan"><i class="c-app"></i><i class="c-pho"></i><i class="c-walk"></i></div>' +
        '<ul class="pt__clist"><li class="c-app"><span>AlpenGo app</span><b data-k="c-app"></b></li><li class="c-pho"><span>Phone</span><b data-k="c-pho"></b></li><li class="c-walk"><span>Walk-in</span><b data-k="c-walk"></b></li></ul>' +
        '<div class="pt__peak"><span class="pt__lbl">Peak hour</span><b>19:00 – 20:00</b><small>Saturday · 31 covers</small></div></div></div></div>';

    // Hour bars (dashboard): built once, heights update live
    var HOURS = [17, 18, 19, 20, 21, 22];
    $('[data-k="hours"]').innerHTML = HOURS.map(function (h) {
      return '<div class="pt__hb' + (h === 19 ? ' is-now' : '') + '"><span></span><i></i><small>' + h + ':00</small></div>';
    }).join('');

    /* ----- Plan fitting: scale the 680×580 plan into the floor panel, centred ----- */
    var planScale = 1;
    var fitPlan = function () {
      var w = floor.clientWidth, h = floor.clientHeight;
      if (!w || !h) return;
      var top = ui.classList.contains('is-compact') ? 34 : 46;
      planScale = Math.min(1.15, (w - 24) / PLAN_W, (h - top - 12) / PLAN_H);
      plan.style.setProperty('--ps', planScale.toFixed(4));
      plan.style.left = Math.max(8, (w - PLAN_W * planScale) / 2) + 'px';
      plan.style.top = (top + Math.max(0, (h - top - 12 - PLAN_H * planScale) / 2)) + 'px';
    };
    if ('ResizeObserver' in window) new ResizeObserver(fitPlan).observe(floor);

    /* ----- State ----- */
    var venues = {};
    var get = function (id) { return venues[id] || (venues[id] = venueState(id)); };
    var cur = get('dahuam');
    var view = 'floor', mode = 'seat', filter = 'all', moving = null, selected = null;
    var nodes = {};

    var active = function (v) { return (v || cur).bookings.filter(function (b) { return b.status !== 'cancelled'; }); };
    var byTime = function (a, c) { return a.time < c.time ? -1 : a.time > c.time ? 1 : 0; };
    var tableOf = function (n, v) { return (v || cur).tables.filter(function (t) { return t.n === n; })[0]; };
    function tableInfo(t, v) {
      var bs = (v || cur).bookings.filter(function (b) { return b.table === t.n; });
      var find = function (s) { return bs.filter(function (b) { return b.status === s; }).sort(byTime)[0]; };
      var a = find('arrived'), c = find('confirmed'), w = find('waiting');
      if (a) return { s: 'occ', b: a, next: c };
      if (c) return { s: 'res', b: c };
      if (w) return { s: 'pending', b: w };
      if (t.blocked) return { s: 'blocked' };
      return { s: 'free' };
    }
    var isFree = function (t, v) { return tableInfo(t, v).s === 'free'; };
    function pickTable(v, guests) {
      var free = v.tables.filter(function (t) { return isFree(t, v); });
      return free.filter(function (t) { return t.seats >= guests; }).sort(function (a, c) { return a.seats - c.seats || a.n - c.n; })[0] ||
        free.sort(function (a, c) { return c.seats - a.seats; })[0];
    }

    /* ----- Rendering ----- */
    function buildTables() {
      plan.innerHTML = '';
      nodes = {};
      cur.tables.forEach(addNode);
    }
    function addNode(t) {
      var d = el('<div class="pt__table' + (t.round ? ' is-round' : '') + '" role="button" tabindex="0"><div class="pt__tin"></div><i class="pt__h h1"></i><i class="pt__h h2"></i><i class="pt__h h3"></i><i class="pt__h h4"></i></div>');
      d.dataset.n = t.n;
      place(d, t);
      nodes[t.n] = d;
      plan.appendChild(d);
      return d;
    }
    function place(d, t) { d.style.cssText = 'left:' + t.x + 'px;top:' + t.y + 'px;width:' + t.w + 'px;height:' + t.h + 'px'; }

    function pop(n, kind) {
      var d = nodes[n];
      if (!d || reduceMotion) return;
      d.classList.remove('is-pop', 'is-pop-free', 'is-pop-occ', 'is-pop-res');
      void d.offsetWidth;
      d.classList.add('is-pop', 'is-pop-' + (kind || 'res'));
      setTimeout(function () { d.classList.remove('is-pop', 'is-pop-' + (kind || 'res')); }, 800);
    }

    function renderTables() {
      cur.tables.forEach(function (t) {
        var d = nodes[t.n] || addNode(t);
        var info = tableInfo(t);
        ['free', 'occ', 'res', 'pending', 'blocked'].forEach(function (s) { d.classList.toggle('is-' + s, info.s === s); });
        d.classList.toggle('is-app', !!(info.b && info.b.src === 'app'));
        d.classList.toggle('is-sel', selected === t.n && mode === 'config');
        d.classList.toggle('is-target', !!moving && info.s === 'free');
        var who = info.b ? info.b.name : info.s === 'blocked' ? 'Blocked' : 'Free';
        var w2 = who.split(' '), short = !t.round && w2.length > 1 && /^[A-ZÄÖÜ]/.test(w2[1]) ? w2[0] + ' ' + w2[1][0] + '.' : w2[0];
        d.querySelector('.pt__tin').innerHTML = '<b>' + t.n + '</b><span class="pt__seats">' + PI.users + t.seats + '</span><em><span class="pt__full">' + who + '</span><span class="pt__short">' + short + '</span></em>' +
          (info.b ? '<small>' + info.b.time + (info.next ? ' · next ' + info.next.time : '') + '</small>' : '');
        d.setAttribute('aria-label', 'Table ' + t.n + ', ' + t.seats + ' seats, ' + ({ free: 'free', occ: 'occupied', res: 'reserved', pending: 'waiting for confirmation', blocked: 'blocked' })[info.s] + (info.b ? ', ' + info.b.name + ' ' + info.b.time : ''));
      });
      var busy = cur.tables.filter(function (t) { var s = tableInfo(t).s; return s === 'occ' || s === 'res'; }).length;
      var pct = Math.round(busy / cur.tables.length * 100);
      $('[data-occ]').textContent = pct + '%';
      return { busy: busy, pct: pct };
    }

    // Re-render a list without losing keyboard focus (the focused button is found again by its data-fk key)
    function keep(container, html) {
      var a = document.activeElement, key = a && container.contains(a) ? a.dataset.fk : null;
      container.innerHTML = html;
      if (a && key != null && !a.isConnected) {
        var again = key && container.querySelector('[data-fk="' + key + '"]');
        (again || container.querySelector('button') || stage).focus({ preventScroll: true });
      }
    }
    var fresh = {};
    function flag(b) { fresh[b.id] = true; }

    function renderList() {
      var w = cur.bookings.filter(function (b) { return b.status === 'waiting'; }).sort(byTime);
      var t = cur.bookings.filter(function (b) { return b.status === 'confirmed' || b.status === 'arrived'; }).sort(byTime);
      keep(waitingEl, w.length ? w.map(function (b) {
        return '<div class="pt__row pt__row--wait' + (b.src === 'app' ? ' is-app' : '') + (fresh[b.id] ? ' is-in' : '') + '" data-id="' + b.id + '"><div class="pt__rtop"><span class="pt__av">' + initials(b.name) + '</span><strong>' + b.name + '</strong>' + (b.src === 'app' ? '<span class="pt__via">' + PI.app + 'App</span>' : '') + '</div>' +
          '<div class="pt__meta"><span>' + PI.clock + b.time + '</span><span>' + PI.users + b.guests + '</span>' + (b.table ? '<span class="pt__tno">' + PI.floor + b.table + '</span>' : '<span class="pt__none">no table yet</span>') + '</div>' +
          '<div class="pt__acts"><button class="pt__accept" type="button" data-act="accept" data-fk="acc' + b.id + '">Accept</button><button class="pt__ibtn" type="button" data-act="move" data-fk="mv' + b.id + '" aria-label="Choose table for ' + b.name + '">' + PI.floor + '</button>' +
          (b.src === 'app' ? '' : '<button class="pt__decline" type="button" data-act="decline" data-fk="dc' + b.id + '">Decline</button>') + '</div></div>';
      }).join('') : '<p class="pt__empty">No open requests</p>');
      keep(tonightEl, t.map(function (b) {
        return '<button type="button" class="pt__row pt__row--t' + (b.status === 'arrived' ? ' is-here' : '') + (b.src === 'app' ? ' is-app' : '') + (fresh[b.id] ? ' is-in' : '') + '" data-id="' + b.id + '" data-fk="t' + b.id + '"><span class="pt__av">' + initials(b.name) + '</span><span class="pt__rname">' + b.name +
          '<span class="pt__meta"><span>' + PI.clock + b.time + '</span><span>' + PI.users + b.guests + '</span></span></span><span class="pt__rside"><i class="pt__dot"></i><span class="pt__tno">' + PI.floor + b.table + '</span></span></button>';
      }).join(''));
      $('[data-wcount]').textContent = w.length;
      $('[data-tcount]').textContent = t.length;
    }

    function actionsFor(b) {
      var k = b.id;
      if (b.status === 'waiting') return '<button class="pt__accept" type="button" data-act="accept" data-fk="ba' + k + '">Accept</button><button class="pt__ibtn" type="button" data-act="move" data-fk="bm' + k + '" aria-label="Choose table">' + PI.floor + '</button>' + (b.src === 'app' ? '' : '<button class="pt__decline" type="button" data-act="decline" data-fk="bd' + k + '">Decline</button>');
      if (b.status === 'confirmed') return '<button class="pt__line" type="button" data-act="seat" data-fk="bs' + k + '">' + PI.check + 'Seat guest</button><span class="pt__ibtn" aria-hidden="true">' + PI.phone + '</span>';
      if (b.status === 'arrived') return '<button class="pt__line pt__line--out" type="button" data-act="checkout" data-fk="bc' + k + '">' + PI.exit + 'Check out</button><span class="pt__ibtn" aria-hidden="true">' + PI.phone + '</span>';
      return '<span class="pt__gone">' + (b.status === 'done' ? 'Guest has left · table freed' : 'Cancelled') + '</span>';
    }
    function renderBookings() {
      var all = cur.bookings.slice().sort(byTime);
      var counts = { all: active().length };
      ['waiting', 'confirmed', 'arrived'].forEach(function (s) { counts[s] = all.filter(function (b) { return b.status === s; }).length; });
      $$('[data-f]', viewEl.book).forEach(function (f) { f.querySelector('em').textContent = counts[f.dataset.f]; });
      var wc = $('[data-bwait]');
      wc.textContent = counts.waiting + ' waiting';
      wc.hidden = !counts.waiting;
      var list = all.filter(function (b) { return filter === 'all' ? b.status !== 'cancelled' : b.status === filter; });
      keep(cardsEl, list.length ? list.map(function (b) {
        return '<article class="pt__bk is-' + b.status + (b.src === 'app' ? ' is-app' : '') + (fresh[b.id] ? ' is-in' : '') + '" data-id="' + b.id + '"><div class="pt__bktop"><strong>' + b.name + '</strong><span class="pt__chip chip-' + b.status + '">' + ST[b.status] + '</span></div>' +
          '<div class="pt__meta"><span>' + PI.clock + b.time + '</span><span>' + PI.users + b.guests + ' pers.</span>' + (b.table ? '<span class="pt__tno">' + PI.floor + b.table + '</span>' : '') + (b.src === 'app' ? '<span class="pt__via">' + PI.app + 'App</span>' : '') + '</div>' +
          '<div class="pt__bkact">' + actionsFor(b) + '</div></article>';
      }).join('') : '<p class="pt__empty pt__empty--big">Nothing here right now.</p>');
      var badge = $('[data-badge]');
      badge.textContent = counts.waiting;
      badge.hidden = !counts.waiting;
    }

    function renderDash(occ) {
      var act = active(), k = function (s) { return $('[data-k="' + s + '"]'); };
      var arr = act.filter(function (b) { return b.status === 'arrived' || b.status === 'done'; }).length;
      var wai = act.filter(function (b) { return b.status === 'waiting'; }).length;
      var con = act.length - arr - wai;
      var guests = act.reduce(function (s, b) { return s + b.guests; }, 0);
      k('total').textContent = act.length; k('arr').textContent = arr; k('con').textContent = con; k('wai').textContent = wai; k('wai2').textContent = wai;
      var st = k('stack').children;
      [arr, con, wai].forEach(function (n, i) { st[i].style.flexGrow = n; st[i].style.display = n ? '' : 'none'; });
      k('guests').textContent = guests;
      k('occ').textContent = occ.pct + '%';
      k('occn').textContent = occ.busy + ' of ' + cur.tables.length + ' tables';
      k('occbar').style.width = occ.pct + '%';
      var per = HOURS.map(function (h) { return act.filter(function (b) { return +b.time.slice(0, 2) === h; }).length; });
      var max = Math.max(4, Math.max.apply(null, per));
      $$('.pt__hb', viewEl.dash).forEach(function (n, i) {
        n.querySelector('i').style.height = (per[i] / max * 100) + '%';
        n.querySelector('span').textContent = per[i];
        n.title = HOURS[i] + ':00 – ' + (HOURS[i] + 1) + ':00 · ' + per[i] + ' booking' + (per[i] === 1 ? '' : 's');
      });
      // sparkline: guests over the last 7 evenings, today live
      var vals = cur.meta.past.concat(guests), mx = Math.max.apply(null, vals) * 1.1, mn = Math.min.apply(null, vals) * .7;
      var pts = vals.map(function (v, i) { return [(i / 6 * 112 + 4).toFixed(1), (32 - (v - mn) / (mx - mn) * 28).toFixed(1)]; });
      var line = 'M' + pts.map(function (p) { return p.join(','); }).join(' L');
      var sp = $('.pt__spark');
      sp.querySelector('.sp-l').setAttribute('d', line);
      sp.querySelector('.sp-a').setAttribute('d', line + ' L116,36 L4,36 Z');
      sp.querySelector('circle').setAttribute('cx', pts[6][0]); sp.querySelector('circle').setAttribute('cy', pts[6][1]);
    }

    function renderNext() {
      var list = cur.bookings.filter(function (b) { return b.status === 'confirmed'; }).sort(byTime).slice(0, 3);
      keep($('[data-next]'), list.length ? list.map(function (b) {
        return '<div class="pt__nrow' + (fresh[b.id] ? ' is-in' : '') + '" data-id="' + b.id + '"><time>' + b.time + '</time><span class="pt__av">' + initials(b.name) + '</span><strong>' + b.name + '</strong>' +
          '<span class="pt__meta"><span>' + PI.users + b.guests + '</span><span class="pt__tno">' + PI.floor + b.table + '</span></span><button class="pt__line" type="button" data-act="seat" data-fk="ns' + b.id + '">' + PI.check + 'Seat</button></div>';
      }).join('') : '<p class="pt__empty">Everyone is seated.</p>');
    }
    function renderStats() {
      var act = active(), m = cur.meta;
      var guests = act.reduce(function (s, b) { return s + b.guests; }, 0);
      var vals = m.past.concat(guests);
      var bks = m.pastB.reduce(function (a, b) { return a + b; }, 0) + act.length;
      var cov = vals.reduce(function (a, b) { return a + b; }, 0);
      var appToday = act.filter(function (b) { return b.src === 'app'; }).length;
      var app = m.pastApp.reduce(function (a, b) { return a + b; }, 0) + appToday;
      var walk = 9 + cur.walkins, pho = bks - app - walk;
      var k = function (s) { return $('[data-k="' + s + '"]', viewEl.stats); };
      k('s-cov').textContent = cov; k('s-bk').textContent = bks; k('s-avg').textContent = (cov / bks).toFixed(1);
      k('s-app').textContent = Math.round(app / bks * 100) + '%';
      var top = Math.ceil(Math.max.apply(null, vals) / 20) * 20;
      k('gl').innerHTML = [top, top / 2, 0].map(function (v) { return '<span><em>' + v + '</em></span>'; }).join('');
      $$('.pt__col', viewEl.stats).forEach(function (c, i) {
        c.querySelector('.pt__barv').style.height = (vals[i] / top * 100) + '%';
        c.querySelector('.pt__val').textContent = vals[i];
        c.title = DAYS[i] + ' · ' + vals[i] + ' covers';
      });
      var ch = k('chan').children;
      [app, pho, walk].forEach(function (n, i) { ch[i].style.flexGrow = n; });
      k('c-app').textContent = app; k('c-pho').textContent = pho; k('c-walk').textContent = walk;
    }

    function update() {
      $$('[data-venue]').forEach(function (n) { n.textContent = byId(cur.id).name; });
      var occ = renderTables();
      renderList();
      renderBookings();
      renderDash(occ);
      renderNext();
      renderStats();
      fresh = {};
      if (!cur.bookings.some(function (b) { return b.status === 'waiting' && b.src === 'app'; }) && toast.dataset.kind === 'booking') hideToast();
    }

    /* ----- Toast ----- */
    var toastT = null;
    function showToast(html, kind, ms) {
      toast.innerHTML = html;
      toast.dataset.kind = kind || '';
      toast.classList.remove('is-on'); void toast.offsetWidth; toast.classList.add('is-on');
      clearTimeout(toastT);
      if (ms) toastT = setTimeout(hideToast, ms);
    }
    function hideToast() { toast.classList.remove('is-on'); toast.dataset.kind = ''; }

    /* ----- Views ----- */
    var viewT = null;
    function moveInk() {
      var b = nav.querySelector('.is-on');
      if (!b || !b.offsetWidth) return;
      ink.style.width = b.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
    function go(name) {
      if (name === view) return;
      cancelMove();
      var order = VIEWS.map(function (v) { return v[0]; });
      var dir = order.indexOf(name) > order.indexOf(view) ? 1 : -1;
      var prev = viewEl[view], next = viewEl[name];
      view = name;
      $$('[data-go]').forEach(function (b) {
        var on = b.dataset.go === name;
        b.classList.toggle('is-on', on);
        if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      });
      moveInk();
      clearTimeout(viewT);
      $$('.pt__view').forEach(function (v) { v.classList.remove('is-in', 'is-out', 'is-cur'); if (v !== prev && v !== next) { v.hidden = true; v.inert = true; } });
      next.hidden = false; next.inert = false; next.classList.add('is-cur');
      next.scrollTop = 0;
      prev.inert = true;
      if (reduceMotion) { prev.hidden = true; return; }
      stage.style.setProperty('--dir', dir);
      next.classList.add('is-in'); prev.classList.add('is-out');
      viewT = setTimeout(function () { prev.hidden = true; prev.classList.remove('is-out'); next.classList.remove('is-in'); }, 400);
    }
    ui.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]');
      if (g) go(g.dataset.go);
    });
    // arrow keys move between the top tabs (roving through the nav like a tab bar)
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var bs = $$('.pt__tab'), i = bs.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length];
      n.focus({ preventScroll: true });
      go(n.dataset.go);
    });
    if ('ResizeObserver' in window) new ResizeObserver(moveInk).observe(nav);

    /* ----- Booking actions (shared by every view) ----- */
    var find = function (id) { return cur.bookings.filter(function (b) { return b.id === id; })[0]; };
    function accept(b, v) {
      v = v || cur;
      if (b.status !== 'waiting') return;
      if (!b.table || !tableOf(b.table, v) || tableInfo(tableOf(b.table, v), v).b !== b) { var t = pickTable(v, b.guests); b.table = t ? t.n : null; }
      if (!b.table) { if (v === cur) showToast('<b>No free table</b><span>Free a table or add one in Configure</span>', 'info', 2600); return; }
      b.status = 'confirmed';
      flag(b);
      if (v === cur) { update(); pop(b.table, 'res'); }
      if (b.src === 'app') bus.emit('accepted', { booking: b.bus, table: b.table });
      else if (v === cur) showToast('<b>' + PI.check + 'Confirmed</b><span>' + b.name + ' · Table ' + b.table + ' · ' + b.time + '</span>', 'info', 2200);
    }
    function seat(b) {
      if (b.status === 'waiting') accept(b);
      if (b.status !== 'confirmed') return;
      // someone else still at this table? they leave first
      cur.bookings.forEach(function (x) { if (x !== b && x.table === b.table && x.status === 'arrived') x.status = 'done'; });
      b.status = 'arrived'; flag(b);
      update(); pop(b.table, 'occ');
      showToast('<b>' + PI.seat + 'Seated</b><span>' + b.name + ' at Table ' + b.table + '</span>', 'info', 2000);
    }
    function checkout(b) {
      var n = b.table;
      if (b.status === 'arrived') b.status = 'done';
      else if (b.status === 'confirmed') b.status = 'cancelled';
      else return;
      flag(b);
      update(); pop(n, tableInfo(tableOf(n)).s === 'free' ? 'free' : 'res');
      showToast('<b>' + PI.exit + 'Table ' + n + ' is free</b><span>' + b.name + (b.status === 'done' ? ' checked out' : ' released') + '</span>', 'info', 2000);
    }
    function decline(b) {
      if (b.status !== 'waiting' || b.src === 'app') return;
      b.status = 'cancelled';
      update();
      showToast('<b>Declined</b><span>' + b.name + ' was notified</span>', 'info', 1800);
    }
    function act(name, b) {
      if (!b) return;
      if (name === 'accept') accept(b);
      else if (name === 'seat') seat(b);
      else if (name === 'checkout') checkout(b);
      else if (name === 'decline') decline(b);
      else if (name === 'move') startMove(b);
    }
    [waitingEl, cardsEl, $('[data-next]')].forEach(function (c) {
      c.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        var b = find(btn.closest('[data-id]').dataset.id);
        if (btn.dataset.act === 'move' && view !== 'floor') go('floor');
        act(btn.dataset.act, b);
      });
    });
    tonightEl.addEventListener('click', function (e) {
      var r = e.target.closest('[data-id]');
      var b = r && find(r.dataset.id);
      if (b && b.table) { pop(b.table, tableInfo(tableOf(b.table)).s); openTable(tableOf(b.table), r); }
    });
    $$('[data-f]', viewEl.book).forEach(function (f) {
      f.addEventListener('click', function () { setFilter(f.dataset.f); });
    });
    function setFilter(f) {
      filter = f;
      $$('[data-f]', viewEl.book).forEach(function (x) { x.classList.toggle('is-on', x.dataset.f === f); x.setAttribute('aria-pressed', x.dataset.f === f); });
      renderBookings();
      if (!reduceMotion) { cardsEl.classList.remove('is-filter'); void cardsEl.offsetWidth; cardsEl.classList.add('is-filter'); }
    }

    /* ----- Move a booking to another table ----- */
    function startMove(b) {
      closeModal(true);
      moving = b;
      floor.classList.add('is-moving');
      pickBar.innerHTML = '<span>' + PI.move + 'Pick a free table for <b>' + b.name + '</b> · ' + b.guests + ' guests</span><button type="button" data-cancel>Cancel</button>';
      renderTables();
      var first = plan.querySelector('.is-target');
      if (first && ui.contains(document.activeElement)) first.focus({ preventScroll: true });
    }
    function cancelMove() {
      if (!moving) return;
      moving = null;
      floor.classList.remove('is-moving');
      renderTables();
    }
    pickBar.addEventListener('click', function (e) { if (e.target.closest('[data-cancel]')) cancelMove(); });
    function finishMove(t) {
      var b = moving, from = b.table;
      moving = null;
      floor.classList.remove('is-moving');
      b.table = t.n; flag(b);
      if (b.status === 'waiting') { accept(b); } else update();
      if (from) pop(from, 'free');
      pop(t.n, b.status === 'arrived' ? 'occ' : 'res');
      showToast('<b>' + PI.move + 'Moved</b><span>' + b.name + (from ? ' · Table ' + from + ' → ' + t.n : ' → Table ' + t.n) + '</span>', 'info', 2000);
    }

    /* ----- Modal (guest details, free table, new reservation) ----- */
    var opener = null, modalOpen = false;
    var behindEls = [$('.pt__side'), $('.pt__main')];
    function openModal(html, label, from) {
      modal.innerHTML = html;
      modal.setAttribute('aria-label', label);
      if (!modalOpen) opener = from || document.activeElement;
      modalOpen = true;
      modal.inert = false; modal.removeAttribute('aria-hidden');
      modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
      behindEls.forEach(function (n) { n.inert = true; });
      ui.classList.add('is-modal');
      if (ui.contains(opener) || opener === document.body) (modal.querySelector('.pt__mx') || modal).focus({ preventScroll: true });
      modal.querySelector('.pt__mx').addEventListener('click', function () { closeModal(); });
      var c = modal.querySelector('[data-close]');
      if (c) c.addEventListener('click', function () { closeModal(); });
    }
    function closeModal(silent) {
      if (!modalOpen) return;
      modalOpen = false;
      var had = modal.contains(document.activeElement);
      ui.classList.remove('is-modal');
      modal.inert = true; modal.setAttribute('aria-hidden', 'true'); modal.removeAttribute('role'); modal.removeAttribute('aria-modal');
      behindEls.forEach(function (n) { n.inert = false; });
      if (had && !silent) {
        var back = opener && opener.isConnected && ui.contains(opener) ? opener : null;
        if (!back && opener && opener.dataset && opener.dataset.fk) back = ui.querySelector('[data-fk="' + opener.dataset.fk + '"]');
        (back || stage.querySelector('.pt__view.is-cur button') || stage).focus({ preventScroll: true });
      }
      opener = null;
    }
    scrim.addEventListener('click', function () { closeModal(); });
    ui.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (modalOpen) { e.stopPropagation(); closeModal(); }
        else if (moving) { e.stopPropagation(); cancelMove(); }
        return;
      }
      if (modalOpen && e.key === 'Tab') {
        var f = $$('button:not([disabled])', modal), i = f.indexOf(document.activeElement);
        if (!f.length) { e.preventDefault(); return; }
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus({ preventScroll: true }); }
        else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus({ preventScroll: true }); }
      }
    });
    var X = '<button class="pt__mx" type="button" aria-label="Close">' + PI.x + '</button>';
    var pill = function (ico, txt) { return '<span class="pt__mp">' + PI[ico] + txt + '</span>'; };

    function openTable(t, from) {
      var info = tableInfo(t), b = info.b;
      if (!b) {
        var blocked = info.s === 'blocked';
        openModal('<div class="pt__mh">' + X + '<small>Table ' + t.n + '</small><h3>' + (blocked ? 'Blocked for tonight' : 'Free table') + '</h3></div>' +
          '<div class="pt__mps">' + pill('users', t.seats + ' seats') + pill('floor', 'Main room') + pill('clock', blocked ? 'Blocked' : 'Free until close') + '</div>' +
          (blocked ? '<button class="pt__mbtn pt__mbtn--line" type="button" data-m="unblock">' + PI.lock + 'Unblock table</button>'
            : '<button class="pt__mbtn pt__mbtn--line pt__mbtn--rust" type="button" data-m="block">' + PI.lock + 'Block table</button>') +
          '<div class="pt__mrow"><button class="pt__mbtn pt__mbtn--ghost" type="button" data-close>Close</button>' +
          (blocked ? '' : '<button class="pt__mbtn pt__mbtn--pri" type="button" data-m="walkin">' + PI.walk + 'Seat walk-in</button>') + '</div>', 'Table ' + t.n, from);
      } else {
        var reqs = (b.reqs || []).map(function (r) { return '<span class="pt__req">' + PI[REQ[r] || 'check'] + r + '</span>'; }).join('');
        if (b.src === 'app') reqs = '<span class="pt__req pt__req--app">' + PI.app + 'Booked in the AlpenGo app</span>' + reqs;
        var pri = b.status === 'waiting' ? ['accept', 'Accept booking', 'check'] : b.status === 'confirmed' ? ['seat', 'Seat guest', 'seat'] : null;
        openModal('<div class="pt__mh">' + X + '<small>Guest details</small><h3>' + b.name + '</h3><span class="pt__chip chip-' + b.status + '">' + ST[b.status] + '</span></div>' +
          '<div class="pt__mps">' + pill('users', 'Party of ' + b.guests) + pill('clock', b.time) + pill('phone', phoneOf(b.name)) + pill('floor', 'Table ' + t.n) + '</div>' +
          '<div class="pt__mlbl">Special requests</div><div class="pt__reqs">' + (reqs || '<span class="pt__none">None noted</span>') + '</div>' +
          '<button class="pt__mbtn pt__mbtn--line" type="button" data-m="move">' + PI.move + 'Move table</button>' +
          '<button class="pt__mbtn pt__mbtn--line pt__mbtn--rust" type="button" data-m="free">' + PI.exit + (b.status === 'arrived' ? 'Check out · free table' : 'Free table') + '</button>' +
          '<div class="pt__mrow' + (pri ? '' : ' is-one') + '"><button class="pt__mbtn pt__mbtn--ghost" type="button" data-close>Close</button>' +
          (pri ? '<button class="pt__mbtn pt__mbtn--pri" type="button" data-m="' + pri[0] + '">' + PI[pri[2]] + pri[1] + '</button>' : '') + '</div>', 'Guest details: ' + b.name, from);
      }
      modal.querySelectorAll('[data-m]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var m = btn.dataset.m;
          if (m === 'move') { startMove(b); return; }
          closeModal();
          if (m === 'accept') accept(b);
          else if (m === 'seat') seat(b);
          else if (m === 'free') checkout(b);
          else if (m === 'block' || m === 'unblock') { t.blocked = m === 'block'; update(); pop(t.n, 'free'); }
          else if (m === 'walkin') {
            var w = { id: cur.id + 'w' + (++uid), name: 'Walk-in · ' + t.n, time: '19:32', guests: Math.min(t.seats, 2), status: 'arrived', table: t.n, reqs: [], src: 'walk' };
            cur.walkins++;
            cur.bookings.push(w); flag(w);
            update(); pop(t.n, 'occ');
            showToast('<b>' + PI.walk + 'Walk-in seated</b><span>Table ' + t.n + '</span>', 'info', 1800);
          }
        });
      });
    }

    function newReservation() {
      var st = { guests: 2, time: '20:30' };
      var name = NEW_NAMES[(cur.bookings.length + uid) % NEW_NAMES.length];
      var times = ['19:30', '20:00', '20:30', '21:00', '21:30'];
      openModal('<div class="pt__mh">' + X + '<small>New reservation</small><h3>' + name + '</h3></div>' +
        '<div class="pt__mps">' + pill('phone', phoneOf(name)) + pill('book', 'Today, 28 Sep') + '</div>' +
        '<div class="pt__mlbl">Guests</div><div class="pt__step"><button type="button" data-g="-1" aria-label="Fewer guests">−</button><b data-gv>2</b><button type="button" data-g="1" aria-label="More guests">+</button></div>' +
        '<div class="pt__mlbl">Time</div><div class="pt__times">' + times.map(function (x) { return '<button type="button" data-t="' + x + '" aria-pressed="' + (x === st.time) + '"' + (x === st.time ? ' class="is-on"' : '') + '>' + x + '</button>'; }).join('') + '</div>' +
        '<div class="pt__mrow"><button class="pt__mbtn pt__mbtn--ghost" type="button" data-close>Cancel</button><button class="pt__mbtn pt__mbtn--pri" type="button" data-save>' + PI.check + 'Save</button></div>', 'New reservation');
      modal.querySelectorAll('[data-g]').forEach(function (b) {
        b.addEventListener('click', function () { st.guests = Math.max(1, Math.min(8, st.guests + +b.dataset.g)); modal.querySelector('[data-gv]').textContent = st.guests; });
      });
      modal.querySelectorAll('[data-t]').forEach(function (b) {
        b.addEventListener('click', function () {
          st.time = b.dataset.t;
          modal.querySelectorAll('[data-t]').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
        });
      });
      modal.querySelector('[data-save]').addEventListener('click', function () {
        var t = pickTable(cur, st.guests);
        closeModal();
        if (!t) { showToast('<b>Fully booked</b><span>No table for ' + st.guests + ' at ' + st.time + '</span>', 'info', 2400); return; }
        var b = { id: cur.id + 'n' + (++uid), name: name, time: st.time, guests: st.guests, status: 'confirmed', table: t.n, reqs: [], src: 'phone' };
        cur.bookings.push(b); flag(b);
        update();
        if (view !== 'floor' && view !== 'book') go('floor');
        setTimeout(function () { pop(t.n, 'res'); }, view === 'floor' ? 380 : 0);
        showToast('<b>' + PI.check + 'Reservation saved</b><span>' + name + ' · ' + st.guests + ' guests · ' + st.time + ' · Table ' + t.n + '</span>', 'info', 2600);
      });
    }
    $('[data-new]').addEventListener('click', newReservation);
    $('.pt__quick').addEventListener('click', function (e) {
      var q = e.target.closest('[data-q]');
      if (!q) return;
      if (q.dataset.q === 'new') newReservation();
      else if (q.dataset.q === 'wait') { setFilter('waiting'); go('book'); }
      else { setMode('seat'); go('floor'); showToast('<b>' + PI.lock + 'Block tables</b><span>Tap a free table, then “Block table”</span>', 'info', 3200); }
    });

    /* ----- Seating / Configure ----- */
    var segBtns = $$('[data-mode]');
    function setMode(m) {
      if (m === mode) return;
      mode = m;
      cancelMove();
      selected = null;
      ui.classList.toggle('is-config', m === 'config');
      segBtns.forEach(function (b) { var on = b.dataset.mode === m; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
      renderTables();
    }
    segBtns.forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });

    var overlaps = function (t, x, y) {
      return cur.tables.some(function (o) { return o !== t && x < o.x + o.w + 10 && x + t.w + 10 > o.x && y < o.y + o.h + 10 && y + t.h + 10 > o.y; });
    };
    var clampX = function (t, x) { return Math.max(0, Math.min(PLAN_W - t.w, x)); };
    var clampY = function (t, y) { return Math.max(0, Math.min(PLAN_H - t.h, y)); };
    var snap = function (v) { return Math.round(v / GRID) * GRID; };
    function select(n) {
      selected = n;
      $$('.pt__table', plan).forEach(function (d) { d.classList.toggle('is-sel', +d.dataset.n === n); });
    }
    function bump(d) { d.classList.remove('is-bump'); void d.offsetWidth; d.classList.add('is-bump'); }

    plan.addEventListener('pointerdown', function (e) {
      var d = e.target.closest('.pt__table');
      if (!d || mode !== 'config' || e.button > 0) return;
      e.preventDefault();
      var t = tableOf(+d.dataset.n);
      select(t.n);
      d.focus({ preventScroll: true });
      var k = plan.getBoundingClientRect().width / PLAN_W || 1;
      var sx = e.clientX, sy = e.clientY, ox = t.x, oy = t.y, ok = { x: t.x, y: t.y };
      try { d.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
      d.classList.add('is-drag');
      var moveH = function (ev) {
        var x = clampX(t, snap(ox + (ev.clientX - sx) / k)), y = clampY(t, snap(oy + (ev.clientY - sy) / k));
        if (x === t.x && y === t.y) return;
        t.x = x; t.y = y;
        var bad = overlaps(t, x, y);
        d.classList.toggle('is-bad', bad);
        if (!bad) ok = { x: x, y: y };
        d.style.left = x + 'px'; d.style.top = y + 'px';
      };
      var upH = function () {
        d.removeEventListener('pointermove', moveH); d.removeEventListener('pointerup', upH); d.removeEventListener('pointercancel', upH);
        d.classList.remove('is-drag');
        if (d.classList.contains('is-bad')) { // dropped on another table: glide back to the last free spot
          d.classList.remove('is-bad');
          t.x = ok.x; t.y = ok.y;
          d.style.left = t.x + 'px'; d.style.top = t.y + 'px';
          bump(d);
        }
      };
      d.addEventListener('pointermove', moveH); d.addEventListener('pointerup', upH); d.addEventListener('pointercancel', upH);
    });
    plan.addEventListener('click', function (e) {
      var d = e.target.closest('.pt__table');
      if (!d || mode === 'config') return;
      var t = tableOf(+d.dataset.n);
      if (moving) {
        if (isFree(t)) finishMove(t); else bump(d);
        return;
      }
      openTable(t, d);
    });
    plan.addEventListener('keydown', function (e) {
      var d = e.target.closest('.pt__table');
      if (!d) return;
      var t = tableOf(+d.dataset.n);
      if (mode === 'config') {
        var dx = { ArrowLeft: -GRID, ArrowRight: GRID }[e.key] || 0, dy = { ArrowUp: -GRID, ArrowDown: GRID }[e.key] || 0;
        if (!dx && !dy) return;
        e.preventDefault();
        select(t.n);
        var x = clampX(t, t.x + dx), y = clampY(t, t.y + dy);
        if (overlaps(t, x, y) || (x === t.x && y === t.y)) { bump(d); return; }
        t.x = x; t.y = y; d.style.left = x + 'px'; d.style.top = y + 'px';
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        d.click();
      }
    });
    plan.addEventListener('focusin', function (e) { var d = e.target.closest('.pt__table'); if (d && mode === 'config') select(+d.dataset.n); });

    $('[data-add]').addEventListener('click', function () {
      var seats = cur.tables.length % 2 ? 4 : 2;
      var t = { n: Math.max.apply(null, cur.tables.map(function (x) { return x.n; })) + 1, seats: seats, w: seats === 2 ? 100 : 140, h: 100, round: seats === 2 ? 1 : 0, blocked: false };
      for (var y = GRID; y <= PLAN_H - t.h - GRID && t.x == null; y += GRID) {
        for (var x = GRID; x <= PLAN_W - t.w - GRID; x += GRID) { if (!overlaps(t, x, y)) { t.x = x; t.y = y; break; } }
      }
      if (t.x == null) { showToast('<b>No space left</b><span>Drag tables closer together first</span>', 'info', 2200); return; }
      cur.tables.push(t);
      var d = addNode(t);
      d.classList.add('is-new');
      setTimeout(function () { d.classList.remove('is-new'); }, 700);
      renderTables();
      select(t.n);
      showToast('<b>' + PI.plus + 'Table ' + t.n + ' added</b><span>' + seats + ' seats · drag it into place</span>', 'info', 2000);
    });

    /* ----- Venue switching ----- */
    function show(v) {
      if (v === cur) return;
      cancelMove();
      closeModal(true);
      cur = v;
      selected = null;
      hideToast();
      buildTables();
      update();
      ui.classList.remove('is-switch'); void ui.offsetWidth; ui.classList.add('is-switch');
    }

    buildTables();
    update();
    fitPlan();
    requestAnimationFrame(moveInk);

    /* ----- Real-time: a booking from a guest phone ----- */
    bus.on('booking', async function (b) {
      var v = get(b.rest.id);
      show(v);
      var t = pickTable(v, b.guests);
      if (!t) { // fully booked: the evening turns over (keeps the demo going after many bookings)
        v.bookings.forEach(function (x) { if (x.status === 'arrived') x.status = 'done'; });
        v.tables.forEach(function (x) { x.blocked = false; });
        t = pickTable(v, b.guests);
      }
      var bk = { id: 'app' + b.id, name: 'Guest (app)', time: b.time, guests: b.guests, status: 'waiting', table: t ? t.n : null, reqs: [], src: 'app', bus: b };
      v.bookings.push(bk); // hold the table right away so a second booking gets another one
      await wait(650); // travel time over the socket
      if (v === cur) {
        flag(bk);
        update();
        showToast('<b>🔔 New booking</b><span>' + b.guests + ' guests · ' + b.time + ' · via AlpenGo</span>', 'booking');
      }
      await wait(2600);
      if (bk.status === 'waiting') accept(bk, v); // the host (or auto-accept) confirms
    });
  }

  /* ---------- Beam between phone and tablet ---------- */
  function Beam(root, bus) {
    if (!root) return;
    var dot = root.querySelector('circle');
    var fire = function (color, reverse) {
      if (reduceMotion) return;
      dot.setAttribute('fill', color);
      dot.animate([{ opacity: 0, offset: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .85 }, { opacity: 0, offset: 1 }], { duration: 650 });
      dot.animate([{ transform: 'translateX(' + (reverse ? 90 : 0) + 'px)' }, { transform: 'translateX(' + (reverse ? 0 : 90) + 'px)' }], { duration: 650, easing: 'ease-in-out' });
    };
    bus.on('booking', function () { fire('#22d3ee', false); });
    bus.on('accepted', function () { fire('#e8b563', true); });
  }

  /* ---------- Mount ---------- */
  function mount(screenSel, baseW, build, bus) {
    var screen = document.querySelector(screenSel);
    if (!screen) return;
    var ui = el('<div class="ui' + (baseW > 400 ? ' ui--tab' : '') + '"></div>');
    screen.appendChild(ui);
    fit(screen, ui, baseW);
    build(ui, bus);
  }

  // Try-it-live section
  var liveBus = makeBus();
  mount('#live-app', 390, GuestApp, liveBus);
  mount('#live-tablet', 1194, PartnerTablet, liveBus);
  Beam(document.querySelector('.live__beam'), liveBus);

  // Guided steps under the live demo tick off as the visitor goes
  var steps = document.querySelectorAll('.live__steps li');
  if (steps.length) {
    var tick = function (i) { if (steps[i]) steps[i].classList.add('is-done'); };
    document.querySelector('#live-app').addEventListener('click', function (e) {
      if (e.target.closest('.ga__rest, [data-rest], .ga__view--detail')) tick(0);
    });
    liveBus.on('booking', function () { tick(0); tick(1); });
    liveBus.on('accepted', function () { tick(2); });
  }

  // Stacked layout (phone above tablet): follow the request down to the tablet, then back up to the phone
  var liveTab = document.querySelector('#live-tablet'), livePhone = document.querySelector('#live-app');
  if (liveTab && livePhone) {
    var stacked = window.matchMedia('(max-width: 1080px)');
    var autoY = null;
    var bring = function (node, block) {
      var r = node.getBoundingClientRect(), vh = window.innerHeight;
      if (r.top >= 72 && r.bottom <= vh - 8) return false; // already fully visible
      var y = block === 'start' ? r.top - 80 : r.top + r.height / 2 - vh / 2; // 'start' clears the fixed header
      window.scrollTo({ top: window.scrollY + y, behavior: reduceMotion ? 'auto' : 'smooth' });
      return true;
    };
    liveBus.on('booking', function () {
      if (!stacked.matches) return;
      autoY = null;
      if (bring(liveTab, 'center')) setTimeout(function () { autoY = window.scrollY; }, 900);
    });
    liveBus.on('accepted', function () {
      if (!stacked.matches) return;
      var y = autoY; autoY = null;
      setTimeout(function () {
        // only return if the visitor hasn't scrolled somewhere else in the meantime
        if (y == null || Math.abs(window.scrollY - y) > 40) return;
        bring(livePhone, 'start');
      }, 900);
    });
  }

  // Hero: all three devices are live and wired together
  var heroBus = makeBus();
  mount('#hero-app', 390, GuestApp, heroBus);
  mount('#hero-tablet', 1194, PartnerTablet, heroBus);
  mount('#hero-chat', 390, function (ui, bus) {
    ui.classList.add('ga');
    ui.innerHTML = '<div class="ga__island"></div><div class="ga__status"><span>19:32</span><span>5G <i></i></span></div><div class="hero-chat" style="height:100%"></div><div class="ga__push" role="status"></div>';
    var push = ui.querySelector('.ga__push');
    var mine = [];
    FabiChat(ui.querySelector('.hero-chat'), {
      onBook: async function (r, btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="ga__spin"></span> Sending to the restaurant…';
        var b = { id: 'b' + (++uid), n: uid, rest: r, guests: 2, time: '19:30', ok: false, btn: btn };
        mine.push(b);
        bus.emit('booking', b);
      }
    });
    bus.on('accepted', async function (d) {
      var b = d.booking;
      if (mine.indexOf(b) < 0 || b.ok) return; // booked from the other phone
      b.ok = true;
      if (b.btn.isConnected) b.btn.textContent = 'Booked ✓ · Table ' + d.table + ' · ' + b.time;
      push.innerHTML = '<b>AG</b><span><strong>Reservation confirmed ✓</strong>' + b.rest.name + ' · Table ' + d.table + ' at ' + b.time + '</span>';
      push.classList.add('is-on');
      var id = push.dataset.b = b.id;
      await wait(3400);
      if (push.dataset.b === id) push.classList.remove('is-on');
    });
  }, heroBus);

  // Pause the infinite decorative animations (fab pulse, live dots, beam dash…) while they are off-screen
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { e.target.classList.toggle('is-offscreen', !e.isIntersecting); });
    }, { rootMargin: '100px 0px' });
    document.querySelectorAll('.stage, .live, .device__screen--live').forEach(function (n) { io.observe(n); });
  }
})();
