// Live prototypes: a clickable AlpenGo guest app, the partner tablet it talks to, and Fabi chat.
// Everything is simulated in the browser — no network — to show how the real product behaves.
(function () {
  var IMG = 'site/img/live/';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, reduceMotion ? 0 : ms); }); };
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
  var byId = function (id) { return RESTAURANTS.filter(function (r) { return r.id === id; })[0]; };

  // Shared event bus between the phone and the tablet
  var bus = {
    h: {},
    on: function (e, f) { (this.h[e] = this.h[e] || []).push(f); },
    emit: function (e, d) { (this.h[e] || []).forEach(function (f) { f(d); }); }
  };

  // Scale each fixed-size UI to its frame
  function fit(screen, ui, baseW) {
    var set = function () { ui.style.setProperty('--s', screen.clientWidth / baseW); };
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
      var c = el('<div class="fc__card"><img alt="" src="' + IMG + r.id + '.webp"><div class="fc__cardb"><strong>' + r.name +
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
      var words = x.a.split(' ');
      for (var i = 0; i < words.length; i++) {
        m.textContent += (i ? ' ' : '') + words[i];
        if (i % 3 === 0) scroll();
        await wait(38);
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
  function GuestApp(ui) {
    ui.classList.add('ga');
    var state = { tab: 0, booking: null, guests: 2, slot: '19:30', rest: null };
    ui.innerHTML =
      '<div class="ga__island"></div><div class="ga__status"><span>19:32</span><span>5G <i></i></span></div>' +
      '<div class="ga__views"></div>' +
      '<button class="ga__fab" type="button" aria-label="Ask Fabi">' + ICON.chat + '</button>' +
      '<nav class="ga__tabs"><span class="ga__tabpill"></span>' +
      ['Today:today', 'Dining:dining', 'Fabi:fabi', 'My Day:day'].map(function (t, i) {
        var p = t.split(':');
        return '<button class="ga__tab' + (i ? '' : ' is-on') + '" type="button" data-tab="' + i + '">' + ICON[p[1]] + p[0] + '</button>';
      }).join('') + '</nav>' +
      '<div class="ga__scrim"></div><div class="ga__sheet" role="dialog" aria-modal="true"></div>' +
      '<div class="ga__push" role="status"></div>';

    var views = ui.querySelector('.ga__views');
    var sheet = ui.querySelector('.ga__sheet');
    var scrim = ui.querySelector('.ga__scrim');
    var push = ui.querySelector('.ga__push');
    var pill = ui.querySelector('.ga__tabpill');
    var tabs = ui.querySelectorAll('.ga__tab');
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
          var c = el('<button class="ga__card ga__rest" type="button"><img alt="" src="' + IMG + r.id + '.webp"><div><strong>' + r.name + '<span>★ ' + r.rating + '</span></strong><p>' + r.cuisine + '</p><span class="ga__open">' + r.open + '</span><span class="ga__pill">Book</span></div></button>');
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
        FabiChat(v.querySelector('.fc-host'), { onBook: function (r) { openBooking(r.id, '19:30'); } });
        return v;
      },
      day: function () {
        var b = state.booking;
        var v = el('<section class="ga__view">' + header('Hello, <span style="color:var(--g-gold)">Guest</span>') +
          '<div class="ga__card ga__rec"><small>YOUR RECOMMENDATION FOR NOW</small><p>The sun sets at 18:52 — the terrace at Dahuam.202 is the warmest seat in the village.</p><span>— your concierge, Fabi</span></div>' +
          '<h3>Your day today</h3><div class="ga__tl">' +
          '<div class="ga__card ga__tli is-done"><time>09:00</time><strong>Breakfast in the hotel</strong><small>Done</small></div>' +
          '<div class="ga__card ga__tli is-done"><time>10:30</time><strong>Isskogelbahn — first run</strong><small>Done</small></div>' +
          (b ? '<div class="ga__card ga__tli is-new"><time>' + b.time + '</time><strong>Dinner at ' + b.rest.name + '</strong><small>Table ' + (b.table || '—') + ' · ' + b.guests + ' guests · ' + (b.ok ? 'confirmed ✓' : 'waiting for the host…') + '</small></div>'
            : '<button class="ga__card ga__tli" type="button" data-go="1" style="width:100%;text-align:left"><time>19:30</time><strong>Dinner — no table yet</strong><small style="color:var(--g-gold)">Reserve a table ›</small></button>') +
          '</div></section>');
        var go = v.querySelector('[data-go]');
        if (go) go.addEventListener('click', function () { goTab(1); });
        return v;
      }
    };
    var ORDER = ['today', 'dining', 'fabi', 'day'];

    function show(next, dir) {
      var prev = current;
      views.appendChild(next);
      current = next;
      if (!prev) return;
      if (reduceMotion) { prev.remove(); return; }
      next.classList.add(dir > 0 ? 'in-next' : 'in-prev');
      prev.classList.add(dir > 0 ? 'out-next' : 'out-prev');
      setTimeout(function () { prev.remove(); next.classList.remove('in-next', 'in-prev'); }, 640);
    }

    function goTab(i) {
      closeSheet();
      var dir = i === state.tab && current && current.classList.contains('ga__view--detail') ? -1 : (i >= state.tab ? 1 : -1);
      if (i === state.tab && !(current && current.classList.contains('ga__view--detail'))) return;
      state.tab = i;
      tabs.forEach(function (t, j) { t.classList.toggle('is-on', j === i); });
      ui.classList.toggle('is-fabi', i === 2);
      pill.style.transform = 'translateX(' + (i * 100) + '%)';
      show(screens[ORDER[i]](), dir);
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { goTab(+t.dataset.tab); }); });
    ui.querySelector('.ga__fab').addEventListener('click', function () { goTab(2); });

    function openDetail(id) {
      var r = byId(id);
      var v = el('<section class="ga__view ga__view--detail"><div class="ga__hero"><img alt="" src="' + IMG + r.id + '.webp"></div>' +
        '<button class="ga__back" type="button" aria-label="Back">' + ICON.back + '</button>' +
        '<div class="ga__dbody"><h2>' + r.name + '</h2><div class="ga__rating"><b>★ ' + r.rating + '</b> · ' + r.cuisine + '</div>' +
        '<div class="ga__tags">' + r.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div><p>' + r.text + '</p>' +
        '<div class="ga__card ga__tonight"><b>★</b><span><strong>Tonight: ' + r.tonight[0] + '</strong>' + r.tonight[1] + '</span></div>' +
        '<div class="ga__actions"><button class="ga__btn" type="button">Call</button><button class="ga__btn ga__btn--gold" type="button" data-book>Book a table</button></div></div></section>');
      v.querySelector('.ga__back').addEventListener('click', function () { goTab(state.tab); });
      v.querySelector('[data-book]').addEventListener('click', function () { openBooking(r.id); });
      show(v, 1);
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
    function openSheet(html) {
      sheet.innerHTML = '<div class="ga__handle"></div>' + html;
      requestAnimationFrame(function () { sheet.classList.add('is-on'); scrim.classList.add('is-on'); });
    }
    function closeSheet() { sheet.classList.remove('is-on'); scrim.classList.remove('is-on'); }
    scrim.addEventListener('click', closeSheet);

    function liftSheet() {
      openSheet('<h4>Lift status · Gerlos</h4><p>Live from the lift operators · updated 19:30</p>' +
        '<div class="ga__lift"><i></i><span>Isskogelbahn</span><small>Open · until 16:00</small></div>' +
        '<div class="ga__lift is-closed"><i></i><span>Königsleitenbahn</span><small>Closed · opens 09:00</small></div>' +
        '<div class="ga__lift"><i></i><span>Übungslift Gerlos</span><small>Open · until 16:30</small></div>' +
        '<button class="ga__acc" type="button" aria-expanded="false">Season 2026/27 hours</button><div class="ga__accbody">Winter season from 5 December to 11 April. First lift 08:30, last ascent 16:00. Night skiing on Thursdays until 21:00.</div>');
      var acc = sheet.querySelector('.ga__acc');
      acc.addEventListener('click', function () { acc.setAttribute('aria-expanded', acc.getAttribute('aria-expanded') !== 'true'); });
    }

    function openBooking(id, slot) {
      var r = byId(id);
      state.rest = r;
      if (slot) state.slot = slot;
      var slots = ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
      openSheet('<h4>Book a table</h4><p>' + r.name + ' · Today, 28 Sep</p>' +
        '<div class="ga__label">Guests</div><div class="ga__stepper"><button type="button" data-g="-1">−</button><strong><span data-guests>' + state.guests + '</span> guests</strong><button type="button" data-g="1">+</button></div>' +
        '<div class="ga__label">Available times</div><div class="ga__slots">' + slots.map(function (s) {
          return '<button class="ga__slot' + (s === state.slot ? ' is-on' : '') + '" type="button"' + (s === '19:00' ? ' disabled' : '') + '>' + s + '</button>';
        }).join('') + '</div><button class="ga__btn ga__btn--gold ga__confirm" type="button"></button>');
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
        confirm.disabled = true;
        confirm.innerHTML = '<span class="ga__spin"></span>';
        await wait(700);
        state.booking = { rest: r, guests: state.guests, time: state.slot, ok: false };
        sheet.innerHTML = '<div class="ga__handle"></div><div class="ga__done"><svg class="ga__check" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36"/><path d="M25 41l10 10 20-22"/></svg>' +
          '<h4>Request sent</h4><p>' + r.name + ' · Today ' + state.slot + ' · ' + state.guests + ' guests</p><div class="ga__wait">● Waiting for the restaurant to confirm…</div></div>';
        bus.emit('booking', state.booking);
      });
    }

    bus.on('accepted', async function (d) {
      if (!state.booking) return;
      state.booking.ok = true;
      state.booking.table = d.table;
      var w = sheet.querySelector('.ga__wait');
      if (w) { w.textContent = '✓ Confirmed · Table ' + d.table; w.classList.add('is-ok'); }
      push.innerHTML = '<b>AG</b><span><strong>Reservation confirmed ✓</strong>' + state.booking.rest.name + ' · Table ' + d.table + ' is ready at ' + state.booking.time + '</span>';
      push.classList.add('is-on');
      await wait(3600);
      push.classList.remove('is-on');
      await wait(300);
      closeSheet();
      goTab(3);
    });

    show(screens.today(), 1);
  }

  /* ---------- Partner tablet ---------- */
  function PartnerTablet(ui) {
    ui.classList.add('pt');
    var TABLES = [
      { n: 1, seats: 2, x: 40, y: 70, w: 92, h: 92, round: 1, s: 'occ', who: 'Lukas G.' },
      { n: 2, seats: 2, x: 170, y: 70, w: 92, h: 92, round: 1, s: 'free' },
      { n: 3, seats: 4, x: 300, y: 70, w: 150, h: 92, s: 'occ', who: 'Familie Hofer' },
      { n: 4, seats: 4, x: 488, y: 70, w: 150, h: 92, s: 'res', who: 'Anna B. · 20:00' },
      { n: 5, seats: 2, x: 40, y: 200, w: 92, h: 92, round: 1, s: 'free' },
      { n: 6, seats: 6, x: 170, y: 200, w: 210, h: 92, s: 'occ', who: 'Markus Wagner' },
      { n: 7, seats: 2, x: 418, y: 200, w: 92, h: 92, round: 1, s: 'free' },
      { n: 8, seats: 4, x: 548, y: 200, w: 90, h: 150, s: 'free' },
      { n: 9, seats: 4, x: 40, y: 330, w: 150, h: 92, s: 'free' },
      { n: 10, seats: 2, x: 228, y: 330, w: 92, h: 92, round: 1, s: 'occ', who: 'Eva L.' },
      { n: 11, seats: 4, x: 358, y: 330, w: 150, h: 92, s: 'res', who: 'Paul E. · 21:00' },
      { n: 12, seats: 8, x: 40, y: 460, w: 300, h: 92, s: 'free' }
    ];
    ui.innerHTML =
      '<aside class="pt__side"><span>' + ICON.today + '</span><span class="is-on"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></span><span>' + ICON.bell + '</span><span>' + ICON.user + '</span></aside>' +
      '<div class="pt__main"><div class="pt__bar"><div><strong>AlpenGO Business</strong><small data-venue>Dahuam.202 Restobar</small></div>' +
      '<nav class="pt__nav"><span>Dashboard</span><b>Floor plan</b><span>Bookings</span><span>Analytics</span><span>Guests</span></nav><span class="pt__live"><i></i>Live</span></div>' +
      '<div class="pt__tools"><span class="pt__clock">19:32</span><span class="pt__seg"><span class="is-on">Seating mode</span><span>Configure</span></span><span class="pt__occ"><b data-occ></b> full</span></div>' +
      '<div class="pt__body"><div class="pt__list"><div class="pt__sec"><span>Waiting</span><span data-wcount>0</span></div><div data-waiting></div>' +
      '<div class="pt__sec"><span>Tonight</span><span>5</span></div><div data-tonight>' +
      '<div class="pt__row"><strong>Familie Hofer<span>18:00 · 4</span></strong><small>Seated · Table 3</small></div>' +
      '<div class="pt__row"><strong>Markus Wagner<span>18:30 · 6</span></strong><small>Seated · Table 6</small></div>' +
      '<div class="pt__row"><strong>Anna Berger<span>20:00 · 4</span></strong><small>Confirmed · Table 4</small></div>' +
      '<div class="pt__row"><strong>Paul Egger<span>21:00 · 3</span></strong><small>Confirmed · Table 11</small></div></div></div>' +
      '<div class="pt__floor"><div class="pt__legend"><span class="l-free">Free</span><span class="l-occ">Occupied</span><span class="l-res">Reserved</span></div><div class="pt__toast"></div></div></div></div>';
    var floor = ui.querySelector('.pt__floor');
    var toast = ui.querySelector('.pt__toast');
    var waiting = ui.querySelector('[data-waiting]');
    var tonight = ui.querySelector('[data-tonight]');
    var nodes = {};
    TABLES.forEach(function (t) {
      var d = el('<div class="pt__table' + (t.round ? ' is-round' : '') + '"></div>');
      d.style.cssText = 'left:' + (t.x + 20) + 'px;top:' + (t.y + 10) + 'px;width:' + t.w + 'px;height:' + t.h + 'px';
      nodes[t.n] = d;
      floor.appendChild(d);
      paint(t);
    });
    function paint(t) {
      var d = nodes[t.n];
      d.classList.toggle('is-occ', t.s === 'occ');
      d.classList.toggle('is-res', t.s === 'res');
      d.innerHTML = '<b>' + t.n + '</b><span>' + t.seats + ' seats</span>' + (t.who ? '<em>' + t.who + '</em>' : '');
    }
    function occ() {
      var busy = TABLES.filter(function (t) { return t.s !== 'free'; }).length;
      ui.querySelector('[data-occ]').textContent = Math.round(busy / TABLES.length * 100) + '%';
    }
    occ();

    var pending = null;
    bus.on('booking', async function (b) {
      ui.querySelector('[data-venue]').textContent = b.rest.name;
      var t = TABLES.filter(function (x) { return x.s === 'free' && x.seats >= b.guests; }).sort(function (a, c) { return a.seats - c.seats; })[0] || TABLES[11];
      pending = { b: b, t: t };
      await wait(650); // travel time over the socket
      toast.innerHTML = '🔔 <span><b>New booking</b> · ' + b.guests + ' guests · ' + b.time + '</span>';
      toast.classList.add('is-on');
      ui.querySelector('[data-wcount]').textContent = '1';
      var row = el('<div class="pt__row is-new"><strong>Guest (app)<span>' + b.time + ' · ' + b.guests + '</span></strong><small><span class="pt__tag pt__tag--wait">Waiting</span> suggested Table ' + t.n + '</small>' +
        '<div class="pt__acts"><button class="pt__accept" type="button">Accept</button><button class="pt__decline" type="button">Decline</button></div></div>');
      waiting.appendChild(row);
      nodes[t.n].classList.add('is-pending');
      var accept = row.querySelector('.pt__accept');
      var done = false;
      var go = async function () {
        if (done) return; done = true;
        accept.classList.add('is-press');
        await wait(260);
        row.remove();
        ui.querySelector('[data-wcount]').textContent = '0';
        nodes[t.n].classList.remove('is-pending');
        t.s = 'res'; t.who = 'Guest · ' + b.time; paint(t);
        nodes[t.n].classList.add('is-pop');
        setTimeout(function () { nodes[t.n].classList.remove('is-pop'); }, 500);
        occ();
        tonight.insertBefore(el('<div class="pt__row is-new"><strong>Guest (app)<span>' + b.time + ' · ' + b.guests + '</span></strong><small><span class="pt__tag">Confirmed</span> Table ' + t.n + '</small></div>'), tonight.firstChild);
        toast.classList.remove('is-on');
        bus.emit('accepted', { table: t.n });
      };
      accept.addEventListener('click', go);
      row.querySelector('.pt__decline').addEventListener('click', go); // the demo always seats the guest
      await wait(2600);
      go();
    });
  }

  /* ---------- Beam between phone and tablet ---------- */
  function Beam(root) {
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
  function mount(screenSel, baseW, build) {
    var screen = document.querySelector(screenSel);
    if (!screen) return;
    var ui = el('<div class="ui' + (baseW > 400 ? ' ui--tab' : '') + '"></div>');
    screen.appendChild(ui);
    fit(screen, ui, baseW);
    build(ui);
  }

  mount('#live-app', 390, GuestApp);
  mount('#live-tablet', 1194, PartnerTablet);
  Beam(document.querySelector('.live__beam'));

  // Guided steps under the live demo tick off as the visitor goes
  var steps = document.querySelectorAll('.live__steps li');
  if (steps.length) {
    var tick = function (i) { if (steps[i]) steps[i].classList.add('is-done'); };
    document.querySelector('#live-app').addEventListener('click', function (e) {
      if (e.target.closest('.ga__rest, [data-rest], .ga__view--detail')) tick(0);
    });
    bus.on('booking', function () { tick(0); tick(1); });
    bus.on('accepted', function () { tick(2); });
  }

  // Hero: the right phone is a live Fabi chat
  mount('#hero-chat', 390, function (ui) {
    ui.classList.add('ga');
    ui.innerHTML = '<div class="ga__island"></div><div class="ga__status"><span>19:32</span><span>5G <i></i></span></div><div class="hero-chat" style="height:100%"></div><div class="ga__push" role="status"></div>';
    var push = ui.querySelector('.ga__push');
    FabiChat(ui.querySelector('.hero-chat'), {
      onBook: async function (r, btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="ga__spin"></span>';
        await wait(900);
        btn.textContent = 'Booked ✓ · Table 5 · 19:30';
        push.innerHTML = '<b>AG</b><span><strong>Reservation confirmed ✓</strong>' + r.name + ' · Table 5 at 19:30</span>';
        push.classList.add('is-on');
        await wait(3200);
        push.classList.remove('is-on');
      }
    });
  });
})();
