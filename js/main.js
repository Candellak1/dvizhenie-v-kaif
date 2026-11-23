/* «Оздоровительный фитнес» — интерактив. Данные и цены только из js/offers-data.js. */
(function () {
  'use strict';
  var O = window.OFFERS;
  if (!O) return;

  var reduced = document.documentElement.classList.contains('reduced');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var rub = O.fmtRub;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function scrollToEl(node) { node.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
  function bump(node) { if (reduced || !node) return; node.classList.remove('is-bump'); void node.offsetWidth; node.classList.add('is-bump'); }
  function setText(id, text) {
    var n = document.getElementById(id);
    if (!n || n.textContent === text) return;
    var from = parseInt(n.textContent.replace(/\D/g, ''), 10);
    var to = parseInt(text.replace(/\D/g, ''), 10);
    // Цены «прокручиваются» к новому значению, остальное просто меняется
    if (n._raf) window.cancelAnimationFrame(n._raf);
    if (n._done) window.clearTimeout(n._done);
    n.setAttribute('data-value', text); // итог, даже если анимация не успела
    if (!reduced && !document.hidden && /₽$/.test(text) && /₽$/.test(n.textContent) && from && to && from !== to) {
      var start = null, dur = 520;
      var step = function (ts) {
        if (start === null) start = ts;
        var k = Math.min(1, (ts - start) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        n.textContent = k < 1 ? rub(Math.round((from + (to - from) * e) / 5) * 5) : text;
        if (k < 1) n._raf = window.requestAnimationFrame(step);
      };
      n._raf = window.requestAnimationFrame(step);
      // Кадры не идут (вкладка в фоне) — всё равно ставим точное значение
      n._done = window.setTimeout(function () { window.cancelAnimationFrame(n._raf); n.textContent = text; }, dur + 80);
    } else n.textContent = text;
    bump(n);
  }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  /* ---------- Меню ---------- */
  var menuBtn = $('.menu-btn');
  var nav = $('#site-nav');
  function closeMenu() { if (!nav) return; nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  }

  /* ---------- 1. Схема тела ---------- */
  var ZONES = {
    neck: { name: 'Шея', requests: ['back', 'sitting', 'stretch'], program: 'neck' },
    shoulders: { name: 'Плечи', requests: ['sitting', 'stretch', 'gym'], program: 'neck' },
    posture: { name: 'Осанка и живот', requests: ['posture', 'sitting'], program: 'posture' },
    lower: { name: 'Поясница', requests: ['back', 'nerve', 'sitting'], program: 'lower' },
    legs: { name: 'Ягодицы и ноги', requests: ['gym', 'joints'], program: 'lower' },
    whole: { name: 'Всё тело', requests: ['gym', 'stretch', 'injury'], program: 'relax' }
  };
  var panel = $('#zone-panel');
  var activeZone = null;

  function zoneNodes(id) {
    return {
      g: $('.zone[data-zone="' + id + '"]'),
      btn: $('.zone-btn[data-zone="' + id + '"]'),
      leader: $('[data-leader="' + id + '"]')
    };
  }
  function setZoneState(id, cls, on) {
    var n = zoneNodes(id);
    [n.g, n.btn].forEach(function (x) { if (x) x.classList.toggle(cls, on); });
    if (n.leader && cls === 'is-active') n.leader.classList.toggle('is-active', on);
    if (n.leader && cls === 'is-hover' && !(activeZone === id)) n.leader.classList.toggle('is-active', on);
  }
  function closeZone(returnFocus) {
    if (!activeZone) return;
    var id = activeZone;
    setZoneState(id, 'is-active', false);
    zoneNodes(id).btn.setAttribute('aria-expanded', 'false');
    activeZone = null;
    panel.hidden = true;
    if (returnFocus) zoneNodes(id).btn.focus();
  }
  function openZone(id, fromKeyboard) {
    if (activeZone === id) { closeZone(true); return; }
    if (activeZone) closeZone(false);
    var z = ZONES[id];
    var prog = O.byId(O.kit.programs, z.program);
    var reqs = z.requests.map(function (r) { return '<li>' + esc(O.byId(O.requests, r).label) + '</li>'; }).join('');
    var t1 = O.kit.tiers[0];
    panel.innerHTML =
      '<button class="zone-panel__close" type="button" aria-label="Закрыть подсказку"></button>' +
      '<h3>' + esc(z.name) + '</h3>' +
      '<p class="zone-panel__k">С чем ко мне приходят</p><ul class="zone-panel__reqs">' + reqs + '</ul>' +
      '<p class="zone-panel__k">Программа в записи</p>' +
      '<p class="zone-panel__prog">«' + esc(prog.title) + '»</p>' +
      '<p class="zone-panel__meta">Из «Фитнес-аптечки»: ' + O.kit.workouts + ' тренировки по ' + O.kit.minutes + ' минут, ' + rub(t1.price) + ' за программу, доступ ' + t1.access + '. Вживую индивидуальные тренировки начинаются с диагностики всего тела — ' + rub(O.diagnostics.price) + '.</p>' +
      '<div class="zone-panel__actions">' +
      '<a class="btn btn--sm" href="#calc-kit" data-zone-prog="' + prog.id + '">Смотреть программу<svg class="btn__i" aria-hidden="true"><use href="#i-corner"/></svg></a>' +
      '<a class="btn btn--sm btn--ghost" href="#booking" data-zone-ask="' + id + '">Задать мне вопрос<svg class="btn__i" aria-hidden="true"><use href="#i-corner"/></svg></a>' +
      '</div>';
    var btn = zoneNodes(id).btn;
    panel.setAttribute('data-side', btn.classList.contains('zone-btn--l') ? 'r' : 'l');
    panel.setAttribute('data-v', parseFloat(btn.style.getPropertyValue('--y')) > 300 ? 'top' : 'bottom');
    panel.hidden = false;
    panel.classList.remove('is-new'); void panel.offsetWidth; panel.classList.add('is-new');
    activeZone = id;
    setZoneState(id, 'is-active', true);
    zoneNodes(id).btn.setAttribute('aria-expanded', 'true');
    if (fromKeyboard) panel.focus({ preventScroll: true });
    if (window.innerWidth < 1000) {
      var r = panel.getBoundingClientRect();
      if (r.bottom > window.innerHeight) panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    }
  }
  $$('.zone-btn').forEach(function (b) {
    var id = b.getAttribute('data-zone');
    b.addEventListener('click', function (e) { openZone(id, e.detail === 0); });
    b.addEventListener('mouseenter', function () { setZoneState(id, 'is-hover', true); });
    b.addEventListener('mouseleave', function () { setZoneState(id, 'is-hover', false); });
    b.addEventListener('focus', function () { setZoneState(id, 'is-hover', true); });
    b.addEventListener('blur', function () { setZoneState(id, 'is-hover', false); });
  });
  $$('.zone').forEach(function (g) {
    var id = g.getAttribute('data-zone');
    g.addEventListener('click', function () { openZone(id, false); });
    g.addEventListener('mouseenter', function () { setZoneState(id, 'is-hover', true); });
    g.addEventListener('mouseleave', function () { setZoneState(id, 'is-hover', false); });
  });
  if (panel) {
    panel.addEventListener('click', function (e) {
      if (e.target.closest('.zone-panel__close')) { closeZone(true); return; }
      var progLink = e.target.closest('[data-zone-prog]');
      if (progLink) { e.preventDefault(); kitSelect([progLink.getAttribute('data-zone-prog')], true); }
      var ask = e.target.closest('[data-zone-ask]');
      if (ask) {
        e.preventDefault();
        var z = ZONES[ask.getAttribute('data-zone-ask')];
        var p = O.byId(O.kit.programs, z.program);
        prefillForm({ request: z.requests[0], service: 'Вопрос по зоне «' + z.name + '», программа «' + p.title + '»' });
      }
    });
  }
  // Линии прорисованы — возвращаем пунктир отвесу и дугам
  $$('.fig .plumb, .fig .arc').forEach(function (p) {
    p.addEventListener('animationend', function () { p.classList.add('is-drawn'); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (nav && nav.classList.contains('is-open')) { closeMenu(); menuBtn.focus(); }
    if (activeZone) closeZone(true);
  });

  /* ---------- Варианты ответов (одни данные для подборщика и формы) ---------- */
  function chip(name, value, label, hint) {
    return '<label class="chip"><input type="radio" name="' + name + '" value="' + esc(value) + '"><span>' + esc(label) +
      (hint ? '<small>' + esc(hint) + '</small>' : '') + '</span></label>';
  }
  function fill(sel, html) { var n = $('[data-options="' + sel + '"]'); if (n) n.innerHTML = html; return n; }

  fill('request', O.requests.map(function (r) { return chip('p-request', r.id, r.label); }).join(''));
  fill('format', O.formats.map(function (f) { return chip('p-format', f.id, f.label, f.hint); }).join(''));
  fill('form-request', O.requests.map(function (r) { return chip('request', r.id, r.label); }).join(''));
  var FORM_FORMATS = [
    { id: 'in_person', label: 'Лично в Вологде' },
    { id: 'online', label: 'Онлайн вживую' },
    { id: 'home', label: 'Выезд на дом' },
    { id: 'recorded', label: 'Программа в записи' }
  ];
  fill('form-format', FORM_FORMATS.map(function (f) { return chip('format', f.id, f.label); }).join(''));

  /* ---------- 2. Подборщик ---------- */
  var pForm = $('#picker-form');
  var pResult = $('#picker-result');
  var pMarker = $('#picker-marker');
  var lastResult = null;

  function radioVal(form, name) { var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : ''; }
  function renderGoals() {
    var fmt = radioVal(pForm, 'p-format');
    var keep = radioVal(pForm, 'p-goal');
    var box = $('[data-options="goal"]');
    if (!fmt) { box.innerHTML = '<p class="step__wait">Сначала выберите, как удобно заниматься.</p>'; return; }
    var list = O.goalsFor(fmt);
    box.innerHTML = list.map(function (g) { return chip('p-goal', g.id, g.label, g.hint); }).join('');
    var still = list.some(function (g) { return g.id === keep; });
    if (still) box.querySelector('input[value="' + keep + '"]').checked = true;
  }
  function pickerUpdate(e) {
    if (e && e.target && e.target.name === 'p-format') renderGoals();
    var vals = [radioVal(pForm, 'p-request'), radioVal(pForm, 'p-format'), radioVal(pForm, 'p-goal')];
    var steps = $$('.step', pForm);
    var answered = 0;
    vals.forEach(function (v, i) { steps[i].classList.toggle('is-done', !!v); if (v) answered++; });
    pMarker.parentNode.parentNode.style.setProperty('--p', String(Math.max(0, answered - 1) / 2));
    pMarker.style.opacity = answered ? '1' : '.35';
    if (answered < 3) {
      if (lastResult) { lastResult = null; pResult.innerHTML = emptyResult; }
      return;
    }
    var r = O.recommend(vals[0], vals[1], vals[2]);
    lastResult = r;
    renderResult(r);
  }
  var emptyResult = pResult ? pResult.innerHTML : '';

  function renderResult(r) {
    if (!r) { pResult.innerHTML = emptyResult; return; }
    var h = '<div class="result">';
    h += '<p class="result__k">Подходит</p><h3>' + esc(r.title) + '</h3>';
    if (r.quote) h += '<p class="result__quote her">«' + esc(r.quote.replace(/\.$/, '')) + '»</p>';
    if (r.lead) h += '<p class="result__lead">' + esc(r.lead) + '</p>';
    if (r.items.length) h += '<ul class="ticks result__items">' + r.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
    if (r.prices.length) {
      h += '<dl class="result__prices">' + r.prices.map(function (p) {
        return '<div><dt>' + esc(p.label) + '</dt><dd>' + rub(p.value) + '</dd>' +
          (p.note ? '<small>' + esc(p.note) + '</small>' : '') + (p.bonus ? '<small>После 8 занятий: ' + esc(p.bonus.toLowerCase()) + '</small>' : '') + '</div>';
      }).join('') + '</dl>';
    }
    var notes = r.notes.concat(r.terms);
    if (notes.length) h += '<ul class="result__notes">' + notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
    if (r.careful) h += '<p class="result__care">' + esc(O.TERMS.medical) + '</p>';
    h += '<div class="result__actions"><button class="btn" type="button" data-result-apply>Оставить заявку на это<svg class="btn__i" aria-hidden="true"><use href="#i-corner"/></svg></button>';
    if (r.service === 'kit') h += '<a class="btn btn--ghost" href="#calc-kit" data-result-calc>Открыть в калькуляторе<svg class="btn__i" aria-hidden="true"><use href="#i-corner"/></svg></a>';
    if (r.service === 'individual') h += '<a class="btn btn--ghost" href="#calc-individual" data-result-calc>Сравнить пакеты<svg class="btn__i" aria-hidden="true"><use href="#i-corner"/></svg></a>';
    h += '</div></div>';
    pResult.innerHTML = h;
  }
  if (pForm) {
    renderGoals();
    pForm.addEventListener('change', pickerUpdate);
    pForm.addEventListener('submit', function (e) { e.preventDefault(); });
    pickerUpdate();
    pResult.addEventListener('click', function (e) {
      if (!lastResult) return;
      if (e.target.closest('[data-result-apply]')) prefillForm(lastResult.prefill);
      var calc = e.target.closest('[data-result-calc]');
      if (calc) {
        e.preventDefault();
        if (lastResult.service === 'kit') kitSelect(lastResult.programs, true);
        else { setIndividual(radioVal(pForm, 'p-goal') === 'course' ? 8 : 1, false); scrollToEl($('#calc-individual')); }
      }
    });
  }

  /* ---------- 3. Калькуляторы ---------- */
  var ind = O.individual;
  var indScale = $('#ind-scale');
  var indOnline = $('#ind-online');
  var indPerson = $('#ind-person');
  $('#ind-includes').innerHTML = ind.includes.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
  $('#diag-includes').innerHTML = O.diagnostics.includes.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
  $('#diag-price').textContent = rub(O.diagnostics.price);
  $('#personal-price').textContent = rub(O.personal.price);
  $('#online-price').textContent = rub(O.online.hour);
  $$('[data-stretch-price]').forEach(function (n) { n.textContent = rub(O.stretch.price); });

  function indN() { var c = indScale.querySelector('input:checked'); return c ? +c.value : 1; }
  function renderIndividual() {
    var online = indOnline.checked;
    $$('input[name="ind-n"]', indScale).forEach(function (i) { i.disabled = online && i.value !== '1'; });
    if (online && indN() !== 1) indScale.querySelector('input[value="1"]').checked = true;
    var n = indN();
    var pack = O.byId(ind.packages.map(function (p) { return { id: p.n, p: p }; }), n).p;
    var total = online ? O.online.hour : pack.price;
    indScale.style.setProperty('--p', String((n - 1) / 7));
    setText('ind-total', rub(total));
    setText('ind-each', rub(O.perUnit(total, n)));
    $('#calc-ind-sub').textContent = online ? 'Онлайн вживую: вы дома, я направляю и корректирую движения. Один час' : (n === 1 ? 'Лично в Вологде, один час' : 'Лично в Вологде, пакет из ' + n + ' занятий');
    var save = $('#ind-save');
    var diff = ind.hour * n - total;
    save.hidden = online || diff <= 0;
    if (!save.hidden) save.textContent = 'На ' + rub(diff) + ' меньше, чем ' + n + ' ' + plural(n, 'разовое занятие', 'разовых занятия', 'разовых занятий') + ' по ' + rub(ind.hour);
    var bonus = $('#ind-bonus');
    bonus.hidden = online || !pack.bonus;
    if (!bonus.hidden) bonus.textContent = 'После 8 занятий: ' + pack.bonus.charAt(0).toLowerCase() + pack.bonus.slice(1) + '.';
    var note = $('#ind-online-note');
    note.hidden = !online;
    var book = $('#ind-book');
    book.setAttribute('data-prefill-format', online ? 'online' : 'in_person');
    book.setAttribute('data-prefill-service', online ? O.online.title : O.individual.title);
  }
  function setIndividual(n, online) {
    (online ? indOnline : indPerson).checked = true;
    var inp = indScale.querySelector('input[value="' + n + '"]');
    if (inp) inp.checked = true;
    renderIndividual();
  }
  if (indScale) {
    indScale.addEventListener('change', renderIndividual);
    indOnline.addEventListener('change', renderIndividual);
    indPerson.addEventListener('change', renderIndividual);
    renderIndividual();
  }

  var kitBox = $('#kit-options');
  kitBox.innerHTML = O.kit.programs.map(function (p, i) {
    return '<label class="kit-opt"><input type="checkbox" name="kit" value="' + p.id + '"' + (i === 0 ? ' checked' : '') + '>' +
      '<span class="kit-opt__box" aria-hidden="true"></span><span class="kit-opt__t">' + esc(p.title) + '</span></label>';
  }).join('');
  var kitScale = $('#kit-marker').parentNode.parentNode;
  function renderKit() {
    var n = $$('input:checked', kitBox).length;
    kitScale.style.setProperty('--p', String(Math.max(0, n - 1) / 3));
    $('#kit-marker').style.opacity = n ? '1' : '.3';
    if (!n) {
      setText('kit-total', '—'); setText('kit-access', '—'); setText('kit-each', 'отметьте программу');
      return;
    }
    var t = O.kit.tiers[n - 1];
    setText('kit-total', rub(t.price));
    setText('kit-access', t.access);
    setText('kit-each', rub(O.perUnit(t.price, n)));
  }
  function kitSelect(ids, go) {
    $$('input', kitBox).forEach(function (i) { i.checked = ids.indexOf(i.value) !== -1; });
    renderKit();
    if (go) {
      scrollToEl($('#calc-kit'));
      var list = $('.kit-list');
      list.classList.remove('is-flash'); void list.offsetWidth; list.classList.add('is-flash');
    }
  }
  kitBox.addEventListener('change', renderKit);
  renderKit();


  /* ---------- 6. Листы программ ---------- */
  var sheets = $('#sheets');
  var sheetBtns = $$('[data-sheets]');
  function sheetStep() { var s = $('.sheet', sheets); return s ? s.getBoundingClientRect().width + 20 : 320; }
  function sheetEnds() {
    var max = sheets.scrollWidth - sheets.clientWidth - 2;
    sheetBtns.forEach(function (b) { b.disabled = +b.getAttribute('data-sheets') < 0 ? sheets.scrollLeft <= 2 : sheets.scrollLeft >= max; });
  }
  sheetBtns.forEach(function (b) {
    b.addEventListener('click', function () { sheets.scrollBy({ left: +b.getAttribute('data-sheets') * sheetStep(), behavior: reduced ? 'auto' : 'smooth' }); });
  });
  if (sheets) {
    sheets.addEventListener('scroll', function () { window.requestAnimationFrame(sheetEnds); }, { passive: true });
    sheets.addEventListener('keydown', function (e) {
      if (e.target !== sheets) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        sheets.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * sheetStep(), behavior: reduced ? 'auto' : 'smooth' });
      }
    });
    window.addEventListener('resize', sheetEnds);
    sheetEnds();
  }
  $$('[data-prefill-service]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      prefillForm({ service: a.getAttribute('data-prefill-service'), format: a.getAttribute('data-prefill-format') || '' });
    });
  });

  /* ---------- 7. Форма заявки ---------- */
  var form = $('#lead-form');
  var ticket = $('#lead-ticket');
  var service = '';
  var tried = false;
  var nameInput = $('#f-name'), vkInput = $('#f-vk'), phoneInput = $('#f-phone'), comment = $('#f-comment'), consent = $('#f-consent');

  function prefillForm(p) {
    if (!form) return;
    if (!ticket.hidden) resetForm();
    if (p.request) { var r = form.querySelector('input[name="request"][value="' + p.request + '"]'); if (r) r.checked = true; }
    if (p.format) { var f = form.querySelector('input[name="format"][value="' + p.format + '"]'); if (f) f.checked = true; }
    service = p.service || '';
    $('#form-service').hidden = !service;
    $('#form-service-name').textContent = service;
    if (tried) validate(false);
    scrollToEl($('#booking'));
    window.setTimeout(function () { nameInput.focus({ preventScroll: true }); }, reduced ? 0 : 650);
  }
  $('#form-service-clear').addEventListener('click', function () { service = ''; $('#form-service').hidden = true; });

  // Способ связи
  function contactMode() { return radioVal(form, 'contact'); }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'contact') {
      var m = contactMode();
      $('#f-vk-wrap').hidden = m !== 'vk';
      $('#f-phone-wrap').hidden = m !== 'phone';
      var focusEl = m === 'vk' ? vkInput : phoneInput;
      window.setTimeout(function () { focusEl.focus(); }, 0);
    }
    if (tried) validate(false);
  });

  // Маска телефона +7 (XXX) XXX-XX-XX
  var prevDigits = '';
  function phoneDigits(v) {
    var d = v.replace(/\D/g, '');
    if (v.trim().indexOf('+7') === 0) d = d.slice(1);
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    return d.slice(0, 10);
  }
  function phoneFormat(d) {
    if (!d) return '';
    var s = '+7 (' + d.slice(0, 3);
    if (d.length > 3) s += ') ' + d.slice(3, 6);
    if (d.length > 6) s += '-' + d.slice(6, 8);
    if (d.length > 8) s += '-' + d.slice(8, 10);
    return s;
  }
  phoneInput.addEventListener('input', function (e) {
    var d = phoneDigits(phoneInput.value);
    if (e.inputType === 'deleteContentBackward' && d === prevDigits) d = d.slice(0, -1);
    prevDigits = d;
    phoneInput.value = phoneFormat(d);
    if (tried) validate(false);
  });
  phoneInput.addEventListener('focus', function () { if (!phoneInput.value) phoneInput.value = '+7 ('; });
  phoneInput.addEventListener('blur', function () { if (!phoneDigits(phoneInput.value)) { phoneInput.value = ''; prevDigits = ''; } });

  nameInput.addEventListener('input', function () { if (tried) validate(false); });
  vkInput.addEventListener('input', function () { if (tried) validate(false); });
  comment.addEventListener('input', function () {
    var c = $('#f-comment-count');
    c.textContent = comment.value.length + ' / 300';
    c.classList.toggle('is-near', comment.value.length > 270);
  });

  var NAME_RE = /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё\s'’-]{1,39}$/;
  function setErr(fieldEl, errId, msg, input) {
    fieldEl.classList.toggle('is-invalid', !!msg);
    document.getElementById(errId).textContent = msg || '';
    if (input) {
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
  }
  function validate(showSummary) {
    var errs = [];
    var name = nameInput.value.trim();
    var nameMsg = !name ? 'Напишите, как к вам обращаться.' : (!NAME_RE.test(name) ? 'Имя — от 2 букв, без цифр и символов.' : '');
    setErr(nameInput.closest('.field'), 'f-name-err', nameMsg, nameInput);
    if (nameMsg) errs.push({ label: 'имя', focus: nameInput });

    var req = radioVal(form, 'request');
    setErr($('#f-request'), 'f-request-err', req ? '' : 'Отметьте, что беспокоит, — хотя бы примерно.');
    if (!req) errs.push({ label: 'что беспокоит', focus: form.querySelector('input[name="request"]') });

    var fmt = radioVal(form, 'format');
    setErr($('#f-format'), 'f-format-err', fmt ? '' : 'Выберите формат занятий.');
    if (!fmt) errs.push({ label: 'формат', focus: form.querySelector('input[name="format"]') });

    var mode = contactMode();
    var cMsg = '', cFocus = form.querySelector('input[name="contact"]');
    if (!mode) cMsg = 'Выберите, как с вами связаться.';
    else if (mode === 'vk') {
      var v = vkInput.value.trim();
      if (v.length < 3) { cMsg = 'Укажите ссылку на страницу ВКонтакте или имя профиля.'; cFocus = vkInput; }
    } else if (phoneDigits(phoneInput.value).length !== 10) { cMsg = 'Номер — 10 цифр после +7.'; cFocus = phoneInput; }
    setErr($('#f-contact'), 'f-contact-err', cMsg);
    vkInput.toggleAttribute('aria-invalid', !!cMsg && mode === 'vk');
    phoneInput.toggleAttribute('aria-invalid', !!cMsg && mode === 'phone');
    if (cMsg) errs.push({ label: 'способ связи', focus: cFocus });

    setErr(consent.closest('.field'), 'f-consent-err', consent.checked ? '' : 'Нужно согласие, чтобы я могла ответить на заявку.', consent);
    if (!consent.checked) errs.push({ label: 'согласие', focus: consent });

    var box = $('#form-errors');
    if (errs.length && (showSummary || !box.hidden)) {
      box.hidden = false;
      box.textContent = 'Заявка не отправлена. Проверьте: ' + errs.map(function (x) { return x.label; }).join(', ') + '.';
    } else if (!errs.length) box.hidden = true;
    return errs;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    tried = true;
    var errs = validate(true);
    if (errs.length) { errs[0].focus.focus(); return; }
    showTicket();
  });

  function showTicket() {
    var req = O.byId(O.requests, radioVal(form, 'request'));
    var fmt = O.byId(FORM_FORMATS, radioVal(form, 'format'));
    var mode = contactMode();
    var contact = mode === 'vk' ? 'ВКонтакте: ' + vkInput.value.trim() : 'Телефон: +7\u00a0···\u00a0···\u2011' + phoneDigits(phoneInput.value).slice(6, 8) + '\u2011' + phoneDigits(phoneInput.value).slice(8);
    var d = new Date();
    var no = 'Заявка № ' + String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 900) + 100);
    var rows = [['Имя', nameInput.value.trim()], ['Что беспокоит', req.label], ['Формат', fmt.label]];
    if (service) rows.push(['Из подбора', service]);
    rows.push(['Связь', contact]);
    if (comment.value.trim()) rows.push(['Комментарий', comment.value.trim().slice(0, 120) + (comment.value.trim().length > 120 ? '…' : '')]);
    $('#ticket-no').textContent = no;
    $('#ticket-rows').innerHTML = rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
    var done = function () {
      form.hidden = true;
      form.classList.remove('is-pinned');
      ticket.hidden = false;
      ticket.focus({ preventScroll: true });
      var top = ticket.getBoundingClientRect().top;
      if (top < 80 || top > window.innerHeight * .6) scrollToEl(ticket.parentNode);
    };
    if (reduced) done(); else { form.classList.add('is-pinned'); window.setTimeout(done, 420); }
  }
  function resetForm() {
    form.reset();
    service = ''; tried = false; prevDigits = '';
    $('#form-service').hidden = true;
    $('#f-vk-wrap').hidden = true; $('#f-phone-wrap').hidden = true;
    $('#form-errors').hidden = true;
    $$('.is-invalid', form).forEach(function (n) { n.classList.remove('is-invalid'); });
    $$('.field__err', form).forEach(function (n) { n.textContent = ''; });
    $$('[aria-invalid]', form).forEach(function (n) { n.removeAttribute('aria-invalid'); });
    $('#f-comment-count').textContent = '0 / 300';
    ticket.hidden = true;
    form.hidden = false;
  }
  $('#ticket-new').addEventListener('click', function () { resetForm(); nameInput.focus(); });

  /* ---------- Появление, позвонки страницы, таймлайн ---------- */
  var io = 'IntersectionObserver' in window;
  if (io && !reduced) {
    var plates = $$('main .plate').filter(function (p) { return !p.closest('.hero'); });
    plates.forEach(function (p) { p.classList.add('reveal'); });
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    plates.forEach(function (p) { revealIO.observe(p); });
  }
  var heads = $$('.sec-head');
  if (io && !reduced) {
    var headIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); headIO.unobserve(en.target); } });
    }, { threshold: .4 });
    heads.forEach(function (h) { headIO.observe(h); });
  } else heads.forEach(function (h) { h.classList.add('is-in'); });

  var skills = $('#skills');
  $$('li', skills).forEach(function (li, i) { li.style.setProperty('--i', i); });
  if (io && !reduced) {
    var skIO = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { skills.classList.add('is-in'); skIO.disconnect(); } }, { threshold: .25 });
    skIO.observe(skills);
  } else skills.classList.add('is-in');

  var sections = ['top', 'picker', 'prices', 'how', 'about', 'programs', 'faq', 'booking'].map(function (id) { return document.getElementById(id); });
  var spineLinks = $$('.spine a');
  var navLinks = $$('.site-nav a');
  var vt = $('#vt');
  var vtSteps = $$('.vt__step', vt);
  var spine = $('.spine');
  var mqDesk = window.matchMedia('(min-width: 900px)');
  function spineMode() { if (spine) spine.inert = !mqDesk.matches; }
  spineMode();
  if (mqDesk.addEventListener) mqDesk.addEventListener('change', spineMode);

  var header = $('#site-header');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    if (header) header.style.setProperty('--progress', progress.toFixed(4));
    var line = window.innerHeight * .4;
    var cur = 0;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) cur = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = sections.length - 1;
    spineLinks.forEach(function (a, i) {
      a.classList.toggle('is-lit', i <= cur);
      a.classList.toggle('is-current', i === cur);
      if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    var curId = sections[cur] && sections[cur].id;
    navLinks.forEach(function (a) { if (a.getAttribute('href') === '#' + curId) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });

    if (vt) {
      var r = vt.getBoundingClientRect();
      var mid = window.innerHeight * .62;
      var pct = Math.max(0, Math.min(1, (mid - r.top) / r.height));
      vt.style.setProperty('--vt-fill', (pct * 100).toFixed(1) + '%');
      vtSteps.forEach(function (s) { s.classList.toggle('is-lit', s.getBoundingClientRect().top + 10 < mid); });
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
