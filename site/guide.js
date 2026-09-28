// Scroll guide: ↑ / ↓ move between the page's windows without scrolling by hand.
(function () {
  var HEADER = 88;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // stops: the hero, every glass window, and the Jàng panel — in page order
  var stops = [document.querySelector('.hero')].concat([].slice.call(document.querySelectorAll('.win, .jang__panel'))).filter(Boolean);
  if (stops.length < 2) return;
  function name(el) {
    if (el.classList.contains('hero')) return 'Top';
    var h = el.querySelector('h2, h3, .work__cat span');
    var t = h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
    if (el.classList.contains('win--intro')) t = 'AlpenGo case study';
    if (el.classList.contains('win--problem')) t = 'Problem & solution';
    if (el.classList.contains('jang__panel')) t = 'Jàng — learn Wolof';
    if (el.classList.contains('win--contact')) t = 'Let’s talk';
    return t.length > 34 ? t.slice(0, 32) + '…' : t;
  }
  var ARROW_UP = '<svg viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></svg>';
  var ARROW_DOWN = '<svg viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg>';
  var el = document.createElement('nav');
  el.className = 'guide';
  el.setAttribute('aria-label', 'Section guide');
  el.innerHTML =
    '<button class="guide__btn guide__btn--up" type="button" aria-label="Previous section">' + ARROW_UP + '<span class="guide__tip"></span></button>' +
    '<div class="guide__count" aria-live="polite"><span data-i>01</span><small data-n></small></div>' +
    '<div class="guide__bar"><i></i></div>' +
    '<button class="guide__btn guide__btn--down" type="button" aria-label="Next section">' + ARROW_DOWN + '<span class="guide__tip"></span></button>';
  document.body.appendChild(el);
  var up = el.querySelector('.guide__btn--up'), down = el.querySelector('.guide__btn--down');
  var tipUp = up.querySelector('.guide__tip'), tipDown = down.querySelector('.guide__tip');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  el.querySelector('[data-n]').textContent = '/ ' + pad(stops.length);

  // layout position, ignoring the opening transform on windows
  function absTop(n) { var y = 0; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; }
  function current() {
    // the last stop whose top has passed the reading line
    var line = HEADER + 40, idx = 0;
    var sy = window.pageYOffset;
    stops.forEach(function (s, i) { if (absTop(s) - sy <= line) idx = i; });
    return idx;
  }
  function go(i) {
    i = Math.max(0, Math.min(stops.length - 1, i));
    var y = i === 0 ? 0 : absTop(stops[i]) - HEADER;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  var cur = -1;
  function update() {
    var i = current();
    if (i === cur) return;
    cur = i;
    el.querySelector('[data-i]').textContent = pad(i + 1);
    el.style.setProperty('--gp', (i / (stops.length - 1)).toFixed(3));
    el.querySelector('.guide__bar i').style.setProperty('--gp', (i / (stops.length - 1)).toFixed(3));
    up.disabled = i === 0;
    down.disabled = i === stops.length - 1;
    tipUp.innerHTML = i > 0 ? '<b>Back</b>' + name(stops[i - 1]) : '';
    tipDown.innerHTML = i < stops.length - 1 ? '<b>Next</b>' + name(stops[i + 1]) : '';
    down.setAttribute('aria-label', i < stops.length - 1 ? 'Next: ' + name(stops[i + 1]) : 'Last section');
    up.setAttribute('aria-label', i > 0 ? 'Back: ' + name(stops[i - 1]) : 'First section');
  }
  up.addEventListener('click', function () { go(current() - 1); });
  down.addEventListener('click', function () {
    var i = current();
    // if the current window's top is still well below the header, finish arriving there first
    var t = absTop(stops[i]) - window.pageYOffset;
    go(t > HEADER + 60 ? i : i + 1);
  });
  var q = false;
  window.addEventListener('scroll', function () { if (!q) { q = true; requestAnimationFrame(function () { q = false; update(); }); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
