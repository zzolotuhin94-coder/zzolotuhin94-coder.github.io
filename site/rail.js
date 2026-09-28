/* Portfolio category rail — builds its own DOM, needs site/rail.css.
   Desktop: vertical glass rail on the left (expands on hover/focus).
   Tablet: compact icon rail. Mobile: floating bottom segmented bar. */
(function () {
  'use strict';

  // ---- Config: one place for categories → anchors (missing ids are skipped) ----
  var RAIL = [
    {
      id: 'apps', label: 'Apps', short: 'Apps', icon: 'phone', start: '#alpengo',
      items: [
        { href: '#alpengo', name: 'AlpenGo' },
        { href: '#jang', name: 'Jàng' }
      ]
    },
    {
      id: 'websites', label: 'Websites', short: 'Web', icon: 'browser', start: '#websites',
      items: [
        { href: '#aura', name: 'AURA One' },
        { href: '#ember-oak', name: 'Ember & Oak' },
        { href: '#novaline', name: 'Novaline' },
        { href: '#mila-hart', name: 'Mila Hart' }
      ]
    },
    {
      id: 'ai', label: 'AI chatbots', short: 'AI', icon: 'spark', start: '#ai',
      items: [
        { href: '#fabi', name: 'Fabi concierge' },
        { href: '#ai-assistant', name: 'Ember & Oak assistant' }
      ]
    }
  ];
  var HEADER = 72;            // fixed header height
  var HERO_SEL = '.hero';     // rail appears after this scrolls away
  var END_SEL = '#contact';   // rail hides over this (falls back to footer)
  var CONTENT_SEL = 'main .wrap';

  if (document.querySelector('.prail')) return;

  var ICONS = {
    phone: '<rect x="6.5" y="2.75" width="11" height="18.5" rx="2.75"/><path d="M10.5 17.9h3"/>',
    browser: '<rect x="3" y="4.5" width="18" height="15" rx="2.75"/><path d="M3 9h18"/><circle cx="6.1" cy="6.75" r=".55" fill="currentColor" stroke="none"/><circle cx="8.1" cy="6.75" r=".55" fill="currentColor" stroke="none"/>',
    spark: '<path d="M20 11.5c0 4.14-3.58 7.5-8 7.5-1.13 0-2.2-.22-3.18-.61L4 19.5l1.2-3.6A7.1 7.1 0 0 1 4 11.5C4 7.36 7.58 4 12 4s8 3.36 8 7.5Z"/><path d="M12 8.2l.85 2.15 2.15.85-2.15.85L12 14.2l-.85-2.15-2.15-.85 2.15-.85Z" fill="currentColor" stroke="none"/>'
  };

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function $(sel) { try { return document.querySelector(sel); } catch (e) { return null; } }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  // ---- Resolve config against the page ----
  var cats = [];
  RAIL.forEach(function (c) {
    var items = c.items.map(function (it) { return { href: it.href, name: it.name, target: $(it.href) }; })
      .filter(function (it) { return it.target; });
    var startEl = $(c.start) || (items[0] && items[0].target);
    if (!startEl) return;
    cats.push({ cfg: c, start: startEl, startHref: $(c.start) ? c.start : items[0].href, items: items });
  });
  if (!cats.length) return;

  // ---- Build DOM ----
  var nav = el('nav', 'prail');
  nav.setAttribute('aria-label', 'Portfolio categories');
  var track = el('span', 'prail__track'); track.setAttribute('aria-hidden', 'true');
  track.appendChild(el('span', 'prail__fill'));
  track.appendChild(el('span', 'prail__tip'));
  var panel = el('div', 'prail__panel');
  var pill = el('span', 'prail__pill'); pill.setAttribute('aria-hidden', 'true');
  var eyebrow = el('div', 'prail__eyebrow', '<span>Explore work</span>'); eyebrow.setAttribute('aria-hidden', 'true');
  var list = el('ul', 'prail__list');
  panel.appendChild(pill); panel.appendChild(eyebrow); panel.appendChild(list);
  nav.appendChild(track); nav.appendChild(panel);

  cats.forEach(function (c) {
    var li = el('li', 'prail__cat'); li.dataset.cat = c.cfg.id;
    var head = el('a', 'prail__head');
    head.href = c.startHref;
    head.innerHTML =
      '<span class="prail__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS[c.cfg.icon] + '</svg></span>' +
      '<span class="prail__label">' + c.cfg.label + '</span>' +
      '<span class="prail__short" aria-hidden="true">' + c.cfg.short + '</span>' +
      '<span class="prail__count"><span class="prail__sr">, </span>' + c.items.length + '<span class="prail__sr"> project' + (c.items.length === 1 ? '' : 's') + '</span></span>';
    head.setAttribute('title', c.cfg.label);
    li.appendChild(head);
    c.head = head; c.li = li;
    if (c.items.length) {
      var sub = el('div', 'prail__sub');
      var ul = el('ul', 'prail__projects');
      c.items.forEach(function (it) {
        var pli = el('li');
        var a = el('a', 'prail__proj');
        a.href = it.href;
        a.textContent = it.name;
        it.link = a; it.cat = c;
        pli.appendChild(a); ul.appendChild(pli);
      });
      sub.appendChild(ul); li.appendChild(sub);
    }
    list.appendChild(li);
  });
  document.body.appendChild(nav);

  var projects = [];
  cats.forEach(function (c) { c.items.forEach(function (it) { projects.push(it); }); });

  // ---- Mode (depends on viewport + free margin next to content) ----
  var mode = '';
  function computeMode() {
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var m;
    if (vw < 1180) m = 'bar';
    else if (vw >= 1280) m = 'dock'; // wide screens: docked, always open, the page makes room for it
    else {
      var wrap = $(CONTENT_SEL), left = wrap ? wrap.getBoundingClientRect().left : (vw - Math.min(1200, vw - 32)) / 2;
      m = left >= 84 ? 'full' : 'dots';
    }
    if (m !== mode) {
      mode = m;
      nav.setAttribute('data-mode', m);
      document.body.classList.toggle('rail-docked', m === 'dock');
      setOpen(m === 'dock', true);
      snap();
    }
  }

  // ---- Expand / collapse (desktop only) ----
  var open = false, openT = 0;
  function canExpand() { return mode === 'full' || mode === 'dots' || mode === 'dock'; }
  function setOpen(v, now) {
    clearTimeout(openT);
    if (mode === 'dock') v = true;
    if (v && !canExpand()) v = false;
    if (now) { apply(v); return; }
    openT = setTimeout(function () { apply(v); }, v ? 70 : 220);
  }
  function apply(v) {
    if (open === v) return;
    open = v;
    nav.classList.toggle('is-open', v);
  }
  nav.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') setOpen(true); });
  nav.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch' && !nav.contains(document.activeElement)) setOpen(false); });
  nav.addEventListener('focusin', function () { setOpen(true, true); });
  nav.addEventListener('focusout', function (e) { if (!nav.contains(e.relatedTarget) && !nav.matches(':hover')) setOpen(false); });
  nav.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { setOpen(false, true); if (document.activeElement && nav.contains(document.activeElement)) document.activeElement.blur(); }
  });

  // ---- Navigation ----
  var lockCat = null, lockT = 0;
  // layout position (ignores reveal transforms that are still animating)
  function docTop(t) {
    var y = 0, n = t;
    while (n) { y += n.offsetTop; n = n.offsetParent; }
    return y;
  }
  function targetTop(t) { return Math.max(0, docTop(t) - HEADER - 16); }
  var lockProj = null;
  function go(e, href, catObj, proj) {
    var t = $(href);
    if (!t) return;
    e.preventDefault();
    var kb = e.detail === 0;
    lockCat = catObj; lockProj = proj || null; clearTimeout(lockT);
    lockT = setTimeout(release, 1600);
    window.scrollTo({ top: targetTop(t), behavior: mq.matches ? 'instant' : 'smooth' });
    try { history.replaceState(null, '', href); } catch (err) {}
    if (kb) {
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
    }
    update();
  }
  function release() { lockCat = null; lockProj = null; update(); }
  window.addEventListener('scrollend', function () { if (lockCat) { clearTimeout(lockT); lockT = setTimeout(release, 60); } });
  // user interrupts smooth scroll → drop the lock
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function (e) { if (lockCat && !(ev === 'keydown' && nav.contains(e.target))) release(); }, { passive: true });
  });
  cats.forEach(function (c) {
    c.head.addEventListener('click', function (e) { go(e, c.startHref, c); });
    c.items.forEach(function (it) { it.link.addEventListener('click', function (e) { go(e, it.href, c, it); }); });
  });

  // ---- Scroll spy ----
  var active = null, shown = false, menuOpen = false;
  function top(n) { return n.getBoundingClientRect().top; }
  function update() {
    raf = 0;
    var vh = window.innerHeight;
    var line = HEADER + (vh - HEADER) * 0.38;

    // visibility: after hero, before contact
    var hero = $(HERO_SEL);
    var endEl = $(END_SEL) || $('footer');
    var afterHero = hero ? hero.getBoundingClientRect().bottom < vh * 0.55 : top(cats[0].start) < vh * 0.7;
    var beforeEnd = endEl ? top(endEl) > vh * 0.62 : true;
    setShown(mode === 'dock' ? !menuOpen : (afterHero && beforeEnd && !menuOpen));

    // active category = last category start above the reading line
    var order = cats.slice().sort(function (a, b) { return top(a.start) - top(b.start); });
    var cur = order[0];
    order.forEach(function (c) { if (top(c.start) <= line) cur = c; });
    if (lockCat) cur = lockCat;
    setActive(cur);

    // active project(s) of the active category; cards sharing a row light up together
    var passed = null;
    cur.items.forEach(function (it) { var t = top(it.target); if (t <= line && (!passed || t >= passed)) passed = t; });
    projects.forEach(function (it) {
      var on = lockProj ? it === lockProj : (passed != null && it.cat === cur && Math.abs(top(it.target) - passed) < 12);
      if (on === it.link.classList.contains('is-active')) return;
      it.link.classList.toggle('is-active', on);
      if (on) it.link.setAttribute('aria-current', 'location'); else it.link.removeAttribute('aria-current');
    });

    // progress: first category start → end section
    var y = window.pageYOffset;
    var s = top(order[0].start) + y - HEADER - 16;
    var eAbs = endEl ? top(endEl) + y - vh * 0.62 : document.documentElement.scrollHeight - vh;
    var prog = eAbs > s ? (y - s) / (eAbs - s) : 0;
    prog = Math.max(0, Math.min(1, prog));
    nav.style.setProperty('--p', prog.toFixed(4));
  }
  function setShown(v) {
    if (v === shown) return;
    shown = v;
    nav.classList.toggle('is-shown', v);
    if (!v) setOpen(false, true);
  }
  function setActive(c) {
    if (c === active) return;
    if (active) { active.li.classList.remove('is-active'); active.head.removeAttribute('aria-current'); }
    active = c;
    c.li.classList.add('is-active');
    c.head.setAttribute('aria-current', 'location');
    placePill();
  }

  // ---- Sliding pill ----
  function placePill() {
    if (!active) return;
    var pr = panel.getBoundingClientRect(), hr = active.head.getBoundingClientRect();
    if (!pr.width) return;
    var x = hr.left - pr.left - panel.clientLeft, y2 = hr.top - pr.top - panel.clientTop;
    pill.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y2.toFixed(2) + 'px,0)';
    pill.style.width = hr.width.toFixed(2) + 'px';
    pill.style.height = hr.height.toFixed(2) + 'px';
    pill.classList.add('is-ready');
  }
  // follow size changes instantly (expand/collapse), slide only between items
  var snapT = 0;
  function snap() {
    nav.classList.add('is-snapping');
    placePill();
    clearTimeout(snapT);
    snapT = setTimeout(function () { nav.classList.remove('is-snapping'); }, 90);
  }
  if (window.ResizeObserver) new ResizeObserver(snap).observe(panel);
  panel.addEventListener('transitionend', snap);

  // ---- Mobile menu ----
  var menu = document.getElementById('mobile-menu');
  function syncMenu() { menuOpen = !!(menu && !menu.hidden); schedule(); }
  if (menu && window.MutationObserver) new MutationObserver(syncMenu).observe(menu, { attributes: true, attributeFilter: ['hidden'] });

  // ---- Loop ----
  var raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { computeMode(); schedule(); });
  window.addEventListener('load', function () { computeMode(); schedule(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(snap);

  syncMenu();
  computeMode();
  update();
  // enable transitions after first paint so nothing animates on load
  requestAnimationFrame(function () { requestAnimationFrame(function () { nav.classList.add('is-live'); }); });
})();
