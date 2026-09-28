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
  // One tablet per restaurant: each venue keeps its own floor plan and lists; a booking brings its venue on screen.
  var LAYOUT = [
    { n: 1, seats: 2, x: 40, y: 70, w: 92, h: 92, round: 1 }, { n: 2, seats: 2, x: 170, y: 70, w: 92, h: 92, round: 1 },
    { n: 3, seats: 4, x: 300, y: 70, w: 150, h: 92 }, { n: 4, seats: 4, x: 488, y: 70, w: 150, h: 92 },
    { n: 5, seats: 2, x: 40, y: 200, w: 92, h: 92, round: 1 }, { n: 6, seats: 6, x: 170, y: 200, w: 210, h: 92 },
    { n: 7, seats: 2, x: 418, y: 200, w: 92, h: 92, round: 1 }, { n: 8, seats: 4, x: 548, y: 200, w: 90, h: 150 },
    { n: 9, seats: 4, x: 40, y: 330, w: 150, h: 92 }, { n: 10, seats: 2, x: 228, y: 330, w: 92, h: 92, round: 1 },
    { n: 11, seats: 4, x: 358, y: 330, w: 150, h: 92 }, { n: 12, seats: 8, x: 40, y: 460, w: 300, h: 92 }
  ];
  var VENUES = {
    dahuam: { occ: { 1: 'Lukas G.', 3: 'Familie Hofer', 6: 'Markus Wagner', 10: 'Eva L.' }, res: { 4: 'Anna B. · 20:00', 11: 'Paul E. · 21:00' },
      tonight: [['Familie Hofer', '18:00', 4, 'Seated', 3], ['Markus Wagner', '18:30', 6, 'Seated', 6], ['Anna Berger', '20:00', 4, 'Confirmed', 4], ['Paul Egger', '21:00', 3, 'Confirmed', 11]] },
    luise: { occ: { 2: 'Jonas K.', 4: 'Sophie M.', 7: 'Tim R.', 12: 'Ski club Gerlos' }, res: { 3: 'Lena F. · 20:30', 9: 'Max H. · 21:00' },
      tonight: [['Ski club Gerlos', '18:00', 8, 'Seated', 12], ['Sophie Maier', '18:45', 4, 'Seated', 4], ['Lena Fischer', '20:30', 4, 'Confirmed', 3], ['Max Huber', '21:00', 3, 'Confirmed', 9]] },
    jaeger: { occ: { 3: 'Familie Gruber', 5: 'Clara W.', 8: 'Stefan P.' }, res: { 6: 'Wanderverein · 20:00', 10: 'Ida S. · 21:30' },
      tonight: [['Familie Gruber', '18:15', 4, 'Seated', 3], ['Stefan Pichler', '19:00', 4, 'Seated', 8], ['Wanderverein', '20:00', 6, 'Confirmed', 6], ['Ida Steiner', '21:30', 2, 'Confirmed', 10]] }
  };
  function venueState(id) {
    var v = VENUES[id] || VENUES.dahuam;
    return {
      id: id,
      tables: LAYOUT.map(function (t) {
        var o = { n: t.n, seats: t.seats, s: 'free', who: '' };
        if (v.occ[t.n]) { o.s = 'occ'; o.who = v.occ[t.n]; } else if (v.res[t.n]) { o.s = 'res'; o.who = v.res[t.n]; }
        return o;
      }),
      waiting: [],
      tonight: v.tonight.map(function (r) { return { name: r[0], time: r[1], guests: r[2], status: r[3], table: r[4] }; })
    };
  }

  function PartnerTablet(ui, bus) {
    ui.classList.add('pt');
    ui.innerHTML =
      '<aside class="pt__side"><span>' + ICON.today + '</span><span class="is-on"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></span><span>' + ICON.bell + '</span><span>' + ICON.user + '</span></aside>' +
      '<div class="pt__main"><div class="pt__bar"><div><strong>AlpenGO Business</strong><small data-venue></small></div>' +
      '<nav class="pt__nav"><span>Dashboard</span><b>Floor plan</b><span>Bookings</span><span>Analytics</span><span>Guests</span></nav><span class="pt__live"><i></i>Live</span></div>' +
      '<div class="pt__tools"><span class="pt__clock">19:32</span><span class="pt__seg"><span class="is-on">Seating mode</span><span>Configure</span></span><span class="pt__occ"><b data-occ></b> full</span></div>' +
      '<div class="pt__body"><div class="pt__list"><div class="pt__sec"><span>Waiting</span><span data-wcount>0</span></div><div data-waiting></div>' +
      '<div class="pt__sec"><span>Tonight</span><span data-tcount>0</span></div><div data-tonight></div></div>' +
      '<div class="pt__floor"><div class="pt__legend"><span class="l-free">Free</span><span class="l-occ">Occupied</span><span class="l-res">Reserved</span></div><div class="pt__plan"></div><div class="pt__toast"></div></div></div></div>';
    var floor = ui.querySelector('.pt__floor');
    var plan = ui.querySelector('.pt__plan');
    var toast = ui.querySelector('.pt__toast');
    var waitingEl = ui.querySelector('[data-waiting]');
    var tonightEl = ui.querySelector('[data-tonight]');
    var nodes = {};
    LAYOUT.forEach(function (t) {
      var d = el('<div class="pt__table' + (t.round ? ' is-round' : '') + '"></div>');
      d.style.cssText = 'left:' + (t.x + 20) + 'px;top:' + (t.y + 10) + 'px;width:' + t.w + 'px;height:' + t.h + 'px';
      nodes[t.n] = d;
      plan.appendChild(d);
    });
    // the floor plan scales down with its panel (compact layout) instead of being cut off
    var fitPlan = function () {
      var w = floor.clientWidth, h = floor.clientHeight;
      if (w && h) plan.style.setProperty('--ps', Math.min(1, (w - 16) / 680, (h - 30) / 580).toFixed(3));
    };
    if ('ResizeObserver' in window) new ResizeObserver(fitPlan).observe(floor);
    fitPlan();

    var venues = {};
    var get = function (id) { return venues[id] || (venues[id] = venueState(id)); };
    var cur = get('dahuam');

    function rowHtml(r) {
      return '<div class="pt__row' + (r.app ? ' is-app' : '') + (r.fresh ? ' is-in' : '') + '"><strong>' + r.name + '<span>' + r.time + ' · ' + r.guests + '</span></strong><small><span class="pt__tag">' + r.status + '</span> Table ' + r.table + '</small></div>';
    }
    function render() {
      ui.querySelector('[data-venue]').textContent = byId(cur.id).name;
      waitingEl.innerHTML = cur.waiting.map(function (w) {
        return '<div class="pt__row is-app' + (w.fresh ? ' is-in' : '') + '" data-id="' + w.b.id + '"><strong>Guest (app)<span>' + w.b.time + ' · ' + w.b.guests + '</span></strong><small><span class="pt__tag pt__tag--wait">Waiting</span> suggested Table ' + w.t.n + '</small>' +
          '<div class="pt__acts"><button class="pt__accept" type="button" data-act="accept">Accept</button><button class="pt__decline" type="button" data-act="decline">Decline</button></div></div>';
      }).join('');
      tonightEl.innerHTML = cur.tonight.map(rowHtml).join('');
      ui.querySelector('[data-wcount]').textContent = cur.waiting.length;
      ui.querySelector('[data-tcount]').textContent = cur.tonight.length;
      cur.waiting.forEach(function (w) { w.fresh = false; });
      cur.tonight.forEach(function (r) { r.fresh = false; });
      cur.tables.forEach(function (t) {
        var d = nodes[t.n];
        d.classList.toggle('is-occ', t.s === 'occ');
        d.classList.toggle('is-res', t.s === 'res');
        d.classList.toggle('is-pending', cur.waiting.some(function (w) { return w.t === t; }));
        d.innerHTML = '<b>' + t.n + '</b><span>' + t.seats + ' seats</span>' + (t.who ? '<em>' + t.who + '</em>' : '');
      });
      var busy = cur.tables.filter(function (t) { return t.s !== 'free'; }).length;
      ui.querySelector('[data-occ]').textContent = Math.round(busy / cur.tables.length * 100) + '%';
      if (!cur.waiting.length) toast.classList.remove('is-on');
    }
    function show(v) {
      if (v === cur) return;
      cur = v;
      toast.classList.remove('is-on');
      render();
      ui.classList.remove('is-switch'); void ui.offsetWidth; ui.classList.add('is-switch');
    }
    render();

    waitingEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var id = btn.closest('[data-id]').dataset.id;
      var w = cur.waiting.filter(function (x) { return x.b.id === id; })[0];
      if (w) accept(w, cur); // the demo always seats the guest, even on "Decline"
    });

    async function accept(w, v) {
      if (w.done) return; w.done = true;
      if (v === cur) {
        var b = waitingEl.querySelector('[data-id="' + w.b.id + '"] .pt__accept');
        if (b) b.classList.add('is-press');
      }
      await wait(260);
      v.waiting.splice(v.waiting.indexOf(w), 1);
      w.t.s = 'res'; w.t.who = 'Guest · ' + w.b.time;
      v.tonight.unshift({ name: 'Guest (app)', time: w.b.time, guests: w.b.guests, status: 'Confirmed', table: w.t.n, app: true, fresh: true });
      if (v === cur) {
        render();
        var n = nodes[w.t.n];
        n.classList.add('is-pop');
        setTimeout(function () { n.classList.remove('is-pop'); }, 500);
      }
      bus.emit('accepted', { booking: w.b, table: w.t.n });
    }

    bus.on('booking', async function (b) {
      var v = get(b.rest.id);
      show(v);
      var free = function (t) { return t.s === 'free' && !v.waiting.some(function (w) { return w.t === t; }); };
      var pick = function () {
        return v.tables.filter(function (x) { return free(x) && x.seats >= b.guests; }).sort(function (a, c) { return a.seats - c.seats; })[0] ||
          v.tables.filter(free).sort(function (a, c) { return c.seats - a.seats; })[0];
      };
      var t = pick();
      if (!t) { // fully booked: the evening turns over (keeps the demo going after many bookings)
        v.tables.forEach(function (x) { if (x.s === 'occ') { x.s = 'free'; x.who = ''; } });
        t = pick();
      }
      var w = { b: b, t: t, fresh: true };
      v.waiting.push(w); // hold the table right away so a second booking gets another one
      await wait(650); // travel time over the socket
      if (v === cur) {
        render();
        toast.innerHTML = '🔔 <span><b>New booking</b> · ' + b.guests + ' guests · ' + b.time + '</span>';
        toast.classList.add('is-on');
      }
      await wait(2600);
      accept(w, v);
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
