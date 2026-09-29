/* Contact channels: hero "Get in touch" menu, contact block, brief form, footer icons.
 *
 * ── ONE place to switch channels on/off ──────────────────────────────────────
 * Every direct channel on the site (index.html and code.html) is rendered from
 * this object. An empty string means the channel is not rendered anywhere:
 * no button, no icon, no broken link. Fiverr is the primary channel.
 *   fiverr    profile URL
 *   email     plain address        → copy button + mailto:, and the brief form sends by email
 *   telegram  username without @   → https://t.me/<username>
 *   linkedin  full profile URL
 *   call      booking page URL     → "Book a 15-min call" (cal.com, Calendly…)
 *   github    profile URL
 */
var CONTACT = {
  fiverr: 'https://www.fiverr.com/zolotuhindev',
  email: '',
  telegram: '',
  linkedin: '',
  call: '',
  github: 'https://github.com/zzolotuhin94-coder'
};

(function () {
  'use strict';
  var C = window.CONTACT_OVERRIDE || CONTACT; // (tests can inject a config before this script)
  var has = function (k) { return typeof C[k] === 'string' && C[k].trim() !== ''; };
  var onCodePage = /code\.html$/.test(location.pathname);
  var home = onCodePage ? 'index.html' : '';

  var ICON = {
    fiverr: '<svg viewBox="0 0 24 24" class="ci ci--fill"><path d="M6 21V11H4.5V8H6V6.8C6 4.3 7.5 3 10 3h2.6v3h-1.8c-.9 0-1.4.4-1.4 1.2V8h3.8v3H9.4v10zM14.8 21V8h3.4v13z"/><circle cx="16.5" cy="4.4" r="2"/></svg>',
    email: '<svg viewBox="0 0 24 24" class="ci"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" class="ci"><path d="M21 4 3 11.2l6.4 2.3M21 4l-3.2 16-8.4-6.5M21 4 9.4 13.5l.6 5.8 3-3.4"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" class="ci ci--fill"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11.5H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.85h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75v5.29h-4z"/></svg>',
    call: '<svg viewBox="0 0 24 24" class="ci"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M12 13.5v3l2 1.2"/></svg>',
    github: '<svg viewBox="0 0 24 24" class="ci ci--fill"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.36 9.36 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9l-.01 2.81c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg>',
    brief: '<svg viewBox="0 0 24 24" class="ci"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    code: '<svg viewBox="0 0 24 24" class="ci"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/></svg>',
    copy: '<svg viewBox="0 0 24 24" class="ci"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="ci"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    out: '<svg viewBox="0 0 24 24" class="ci"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" class="ci"><path d="m6 9 6 6 6-6"/></svg>'
  };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tgHandle() { return C.telegram.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, ''); }
  function hostPath(u) { return u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); }

  // Every channel as data: what to show, where it goes. Order = order on the page.
  function channels() {
    var list = [];
    if (has('email')) list.push({ id: 'email', name: 'Email', value: C.email, href: 'mailto:' + C.email, copy: C.email, hint: 'Copy address' });
    if (has('telegram')) list.push({ id: 'telegram', name: 'Telegram', value: '@' + tgHandle(), href: 'https://t.me/' + tgHandle(), ext: true, hint: 'Open chat' });
    if (has('linkedin')) list.push({ id: 'linkedin', name: 'LinkedIn', value: hostPath(C.linkedin).replace(/^[a-z]{0,3}\.?linkedin\.com\//, ''), href: C.linkedin, ext: true, hint: 'Connect' });
    if (has('call')) list.push({ id: 'call', name: 'Book a 15-min call', value: 'Pick a time that suits you', href: C.call, ext: true, hint: 'Book' });
    return list;
  }

  /* ── clipboard + toast ─────────────────────────────────────────── */
  function copyText(text) {
    // Synchronous path first: it works inside the click even if a new tab opens right after.
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
      document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); document.body.removeChild(ta);
    } catch (e) { ok = false; }
    if (!ok && navigator.clipboard) { navigator.clipboard.writeText(text).catch(function () {}); ok = true; }
    return ok;
  }

  var toastEl, toastTimer;
  function toast(msg, icon) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'ctoast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span class="ctoast__icon">' + (ICON[icon] || ICON.check) + '</span><span>' + esc(msg) + '</span>';
    toastEl.classList.remove('is-on'); void toastEl.offsetWidth; toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3600);
  }

  // "Copied ✓" on the control itself, then back
  function flashCopied(btn, labelSel) {
    var label = labelSel ? btn.querySelector(labelSel) : null;
    btn.classList.add('is-copied');
    if (label) { if (!label.dataset.orig) label.dataset.orig = label.textContent; label.textContent = 'Copied ✓'; }
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { btn.classList.remove('is-copied'); if (label) label.textContent = label.dataset.orig; }, 1800);
  }

  /* ── static links: [data-contact="github|fiverr|…"] get their href, or disappear ─ */
  document.querySelectorAll('[data-contact]').forEach(function (el) {
    var k = el.getAttribute('data-contact');
    if (!has(k)) { el.parentNode && el.parentNode.removeChild(el); return; }
    if (el.tagName === 'A') el.href = k === 'email' ? 'mailto:' + C.email : C[k];
  });

  /* ── Hero: "Get in touch" menu ─────────────────────────────────── */
  // Without any direct channel the static fallback in the HTML stays: a plain "Send a brief" button.
  var reach = document.querySelector('[data-reach]');
  if (reach && channels().length) {
    reach.innerHTML = '<button type="button" class="btn btn--ghost reach__btn" aria-expanded="false" aria-controls="reach-menu">Get in touch <span class="reach__chev" aria-hidden="true">' + ICON.chevron + '</span></button>' +
      '<div class="reach__menu" id="reach-menu" role="group" aria-label="Contact options" hidden></div>';
    var btn = reach.querySelector('.reach__btn');
    var menu = reach.querySelector('.reach__menu');
    var rows = channels().map(function (c) {
      var main = c.copy
        ? '<button type="button" class="reach__item" data-copy="' + esc(c.copy) + '"><span class="reach__ic">' + ICON[c.id] + '</span><span class="reach__txt"><b>' + esc(c.name) + '</b><small class="reach__val">' + esc(c.value) + '</small></span><span class="reach__act" aria-hidden="true">' + ICON.copy + '</span><span class="sr-only"> — copy address</span></button>'
        : '<a class="reach__item" href="' + esc(c.href) + '"' + (c.ext ? ' target="_blank" rel="noopener"' : '') + '><span class="reach__ic">' + ICON[c.id] + '</span><span class="reach__txt"><b>' + esc(c.name) + '</b><small>' + esc(c.value) + '</small></span><span class="reach__act" aria-hidden="true">' + ICON.out + '</span></a>';
      if (c.id === 'email') main = '<div class="reach__pair">' + main + '<a class="reach__mini" href="' + esc(c.href) + '" aria-label="Write an email to ' + esc(c.copy) + '" title="Open in your mail app">' + ICON.out + '</a></div>';
      return main;
    });
    rows.push('<a class="reach__item" href="#contact" data-close><span class="reach__ic">' + ICON.brief + '</span><span class="reach__txt"><b>Send a brief</b><small>Three fields, one minute</small></span><span class="reach__act" aria-hidden="true">→</span></a>');
    if (has('fiverr')) rows.push('<a class="reach__item" href="' + esc(C.fiverr) + '" target="_blank" rel="noopener"><span class="reach__ic reach__ic--fiverr">' + ICON.fiverr + '</span><span class="reach__txt"><b>Message on Fiverr</b><small>Safe payments &amp; milestones</small></span><span class="reach__act" aria-hidden="true">' + ICON.out + '</span></a>');
    menu.innerHTML = '<p class="reach__head">Reach me directly</p>' + rows.join('') +
      '<p class="reach__foot"><i></i>Usually replies within a few hours</p>';

    var items = function () { return [].slice.call(menu.querySelectorAll('a, button')); };
    var isOpen = function () { return btn.getAttribute('aria-expanded') === 'true'; };
    function setOpen(open, focusBtn) {
      btn.setAttribute('aria-expanded', String(open));
      reach.classList.toggle('is-open', open);
      if (open) {
        menu.hidden = false;
        // if the menu runs past the bottom of the screen, glide the page up just enough (never hiding the button)
        var r = menu.getBoundingClientRect(), br = btn.getBoundingClientRect();
        var need = r.bottom - innerHeight + 20;
        if (need > 0) window.scrollBy({ top: Math.min(need, br.top - 90), behavior: 'smooth' });
        requestAnimationFrame(function () { menu.classList.add('is-on'); });
      }
      else {
        menu.classList.remove('is-on');
        setTimeout(function () { if (!isOpen()) menu.hidden = true; }, 260);
        if (focusBtn) btn.focus();
      }
    }
    btn.addEventListener('click', function () {
      var open = !isOpen();
      setOpen(open);
      if (open && btn._kbd) { var f = items()[0]; f && f.focus(); }
      btn._kbd = false;
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') btn._kbd = true;
      if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); var f = items()[0]; setTimeout(function () { f && f.focus(); }, 0); }
    });
    menu.addEventListener('keydown', function (e) {
      var list = items(), i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); list[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); list[list.length - 1].focus(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) setOpen(false, true); });
    document.addEventListener('pointerdown', function (e) { if (isOpen() && !reach.contains(e.target)) setOpen(false); });
    reach.addEventListener('focusout', function (e) { if (isOpen() && e.relatedTarget && !reach.contains(e.relatedTarget)) setOpen(false); });
    menu.addEventListener('click', function (e) {
      var copy = e.target.closest('[data-copy]');
      if (copy) { if (copyText(copy.getAttribute('data-copy'))) flashCopied(copy, '.reach__val'); return; }
      var a = e.target.closest('a');
      if (a) setOpen(false);
    });
  }

  /* ── Contact block: channel rows ───────────────────────────────── */
  var sec = document.getElementById('contact');
  if (sec && channels().length >= 2) sec.classList.add('contact--many');
  var orLabel = document.querySelector('.contact__or span');
  if (orLabel && channels().length) orLabel.textContent = 'Or reach me directly';
  document.querySelectorAll('[data-channels="list"]').forEach(function (box) {
    var html = channels().map(function (c) {
      if (c.copy) {
        return '<li class="chan"><a class="chan__main" href="' + esc(c.href) + '"><span class="chan__ic">' + ICON[c.id] + '</span><span class="chan__txt"><b>' + esc(c.name) + '</b><small>' + esc(c.value) + '</small></span></a>' +
          '<button type="button" class="chan__copy" data-copy="' + esc(c.copy) + '" aria-label="Copy email address">' + '<span class="chan__copy-ic">' + ICON.copy + '</span><span class="chan__copy-ok">' + ICON.check + '</span><span class="chan__copy-t">Copy</span></button></li>';
      }
      return '<li class="chan"><a class="chan__main" href="' + esc(c.href) + '"' + (c.ext ? ' target="_blank" rel="noopener"' : '') + '><span class="chan__ic">' + ICON[c.id] + '</span><span class="chan__txt"><b>' + esc(c.name) + '</b><small>' + esc(c.value) + '</small></span><span class="chan__go" aria-hidden="true">' + ICON.out + '</span></a></li>';
    });
    if (has('github')) html.push('<li class="chan"><a class="chan__main" href="' + esc(C.github) + '" target="_blank" rel="noopener"><span class="chan__ic">' + ICON.github + '</span><span class="chan__txt"><b>GitHub</b><small>' + esc(hostPath(C.github)) + '</small></span><span class="chan__go" aria-hidden="true">' + ICON.out + '</span></a></li>');
    html.push('<li class="chan"><a class="chan__main" href="' + (onCodePage ? '#top' : 'code.html') + '"><span class="chan__ic">' + ICON.code + '</span><span class="chan__txt"><b>Code samples</b><small>State machine, Socket.io, Claude API</small></span><span class="chan__go" aria-hidden="true">→</span></a></li>');
    box.innerHTML = html.join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (b && copyText(b.getAttribute('data-copy'))) { flashCopied(b, '.chan__copy-t'); toast('Email address copied'); }
    });
  });

  /* ── Footer / compact icon rows ────────────────────────────────── */
  document.querySelectorAll('[data-channels="icons"]').forEach(function (box) {
    var list = [];
    if (has('fiverr')) list.push({ id: 'fiverr', name: 'Fiverr', href: C.fiverr, ext: true });
    channels().forEach(function (c) { list.push(c); });
    if (has('github')) list.push({ id: 'github', name: 'GitHub', href: C.github, ext: true });
    box.innerHTML = list.map(function (c) {
      var label = c.id === 'email' ? 'Email ' + C.email : c.id === 'call' ? 'Book a call' : c.name;
      return '<a class="ficon" href="' + esc(c.href) + '"' + (c.ext ? ' target="_blank" rel="noopener"' : '') + ' aria-label="' + esc(label) + '" title="' + esc(label) + '">' + ICON[c.id] + '</a>';
    }).join('');
  });

  /* ── Brief form ────────────────────────────────────────────────── */
  var form = document.querySelector('[data-brief]');
  if (form) {
    var submit = form.querySelector('.brief__submit');
    var note = form.querySelector('.brief__note');
    var byEmail = has('email');
    // The sender's email only matters when the brief goes out by email (Fiverr keeps contact on-platform).
    form.querySelectorAll('[data-needs="email"]').forEach(function (el) { el.hidden = !byEmail; });
    if (submit) submit.querySelector('span').textContent = byEmail ? 'Send brief by email' : 'Copy brief & open Fiverr';
    if (note) note.textContent = byEmail
      ? 'Opens your mail app with everything filled in. Prefer Fiverr? Use the button on the left.'
      : 'Your brief is copied to the clipboard, then Fiverr opens — just paste it into the message.';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var what = form.elements.what, mail = form.elements.email;
      form.classList.add('was-checked');
      if (!form.checkValidity()) {
        var bad = form.querySelector(':invalid');
        if (bad) bad.focus();
        return;
      }
      var name = form.elements.name.value.trim();
      var budget = (form.querySelector('input[name="budget"]:checked') || {}).value || 'Not sure yet';
      var lines = [
        'Hi Dimi,', '',
        'What I want to build:', what.value.trim(), '',
        'Budget: ' + budget
      ];
      if (name) lines.push('Name: ' + name);
      if (byEmail && mail.value.trim()) lines.push('Email: ' + mail.value.trim());
      lines.push('', '— sent from the Aurum Forge by Zolotuhin site');
      var body = lines.join('\n');

      if (byEmail) {
        var subject = 'Project brief' + (name ? ' — ' + name : '');
        window.location.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        toast('Opening your mail app…', 'email');
      } else {
        copyText(body);
        if (has('fiverr')) window.open(C.fiverr, '_blank', 'noopener');
        toast('Brief copied — paste it into Fiverr', 'check');
      }
      form.classList.add('is-sent');
      setTimeout(function () { form.classList.remove('is-sent'); }, 2400);
    });
  }

  // Expose for the code page / debugging
  window.ZContact = { config: C, copy: copyText, toast: toast, icon: ICON, home: home };
})();
