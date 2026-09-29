// Code samples page: nav, tabs (with #hash deep links), a tiny JS/TS syntax highlighter, copy buttons.
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Sticky nav + mobile menu (same behaviour as the portfolio page)
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 20); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  var toggle = document.querySelector('.nav__toggle'), menu = document.getElementById('mobile-menu');
  function setMenu(open) { toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); menu.hidden = !open; }
  toggle.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); } });

  /* ── Highlighter: one sticky regex per token kind, tried in order ── */
  var KW = 'const|let|var|function|return|if|else|for|of|in|async|await|try|catch|new|import|from|export|type|interface|typeof|throw|as';
  var RULES = [
    ['c', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ['s', /`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/y],
    ['n', /\b\d+(?:\.\d+)?\b/y],
    ['k', new RegExp('\\b(?:' + KW + ')\\b', 'y')],
    ['b', /\b(?:true|false|null|undefined|this|module|require|process)\b/y],
    ['t', /\b[A-Z][A-Za-z0-9_]*\b/y],
    ['f', /\b[a-zA-Z_$][\w$]*(?=\s*(?:\(|=\s*(?:async\s*)?\([^)]*\)\s*=>|=\s*useCallback))/y],
    ['p', /[a-zA-Z_$][\w$]*(?=\??:\s)/y],
    ['o', /=>|===|!==|&&|\|\||\?\?|\?\.|[=<>!+\-*/%?]/y],
    ['w', /[a-zA-Z_$][\w$]*|\s+|[\s\S]/y]
  ];
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function tokenize(src) {
    var out = [], i = 0;
    while (i < src.length) {
      for (var r = 0; r < RULES.length; r++) {
        var re = RULES[r][1]; re.lastIndex = i;
        var m = re.exec(src);
        if (m && m[0].length) { out.push([RULES[r][0], m[0]]); i += m[0].length; break; }
      }
    }
    return out;
  }
  function paint(cls, text) {
    if (cls === 'w') return esc(text);
    var body = esc(text);
    if (cls === 's' && text.charAt(0) === '`') body = body.replace(/\$\{([^}]*)\}/g, '<span class="tk-i">${$1}</span>');
    return '<span class="tk-' + cls + '">' + body + '</span>';
  }
  function highlight(code) {
    var src = code.textContent;
    code._raw = src;
    // split every token on newlines so each line is its own element (line numbers via CSS counters)
    var lines = [''];
    tokenize(src).forEach(function (t) {
      t[1].split('\n').forEach(function (part, k) {
        if (k > 0) lines.push('');
        if (part) lines[lines.length - 1] += paint(t[0], part);
      });
    });
    code.innerHTML = lines.map(function (l) { return '<span class="ln">' + (l || ' ') + '</span>'; }).join('');
  }
  document.querySelectorAll('.cp-pre code').forEach(highlight);

  /* ── Tabs ── */
  var tabs = [].slice.call(document.querySelectorAll('.cp-tab'));
  function select(tab, focus, fromHash) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) { panel.classList.remove('is-in'); void panel.offsetWidth; panel.classList.add('is-in'); }
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (!fromHash && history.replaceState) history.replaceState(null, '', '#' + tab.dataset.tab);
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); select(tabs[j], true); }
    });
  });
  function fromHash() {
    var id = location.hash.slice(1);
    var t = tabs.filter(function (x) { return x.dataset.tab === id; })[0];
    if (t) select(t, false, true);
  }
  window.addEventListener('hashchange', fromHash);
  if (location.hash) fromHash();

  /* ── Copy buttons ── */
  document.querySelectorAll('.cp-copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var code = b.closest('.cp-panel').querySelector('code');
      var ok = window.ZContact ? window.ZContact.copy(code._raw || code.textContent) : false;
      if (!ok && navigator.clipboard) { navigator.clipboard.writeText(code._raw || code.textContent); ok = true; }
      if (!ok) return;
      var label = b.querySelector('span');
      b.classList.add('is-copied'); label.textContent = 'Copied ✓';
      clearTimeout(b._t);
      b._t = setTimeout(function () { b.classList.remove('is-copied'); label.textContent = 'Copy'; }, 1800);
    });
  });
})();
