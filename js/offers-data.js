/* Услуги, цены и правила подбора — единственный источник для подборщика,
   калькуляторов, формы и таблиц <noscript> (tools/build-noscript.mjs).
   Источник: карточки магазина и закреплённый пост сообщества vk.com/bud_v_forme35, ноябрь 2026.
   Здесь только цены и сроки; производные (цена за занятие, за программу, выгода) считает код. */
(function (root) {
  'use strict';

  var LINKS = {
    community: 'https://vk.com/bud_v_forme35',
    communityMessage: 'https://vk.me/bud_v_forme35',
    alena: 'https://vk.me/alena_sokolova18',
    freeWorkouts: 'https://vk.com/app5898182_-161088776'
  };

  var TERMS = {
    prepay: 'Первая встреча согласовывается только по 50% предоплате.',
    home: 'Есть возможность выезда на дом.',
    medical: 'Занятия не заменяют лечение. Если есть травма или острая боль, обсудите нагрузку с врачом.'
  };

  // Индивидуальная тренировка лично (карточка «от 3 125 ₽»).
  var individual = {
    id: 'individual',
    title: 'Индивидуальная тренировка',
    hour: 3500,
    packages: [
      { n: 1, price: 3500 },
      { n: 4, price: 13000 },
      { n: 8, price: 25000, bonus: 'Доступ к онлайн-банку «зарядок здоровья» на полгода' }
    ],
    includes: [
      'Полная диагностика тела: слабые места, напряжение, проблемы с подвижностью',
      'Коррекция дисбаланса',
      'Улучшение гибкости',
      'Бережная растяжка',
      'Силовая поддержка слабых зон'
    ],
    quote: 'Комплексная проработка всего за один час.'
  };

  // Лайв через экран.
  var online = {
    id: 'online',
    title: 'Индивидуальная тренировка онлайн вживую',
    hour: 3000,
    quote: 'Вы у себя дома, я вас направляю, учу двигаться правильно и корректирую.',
    discount: { text: 'На онлайн-индивидуальные сейчас скидка 15%', note: 'актуальность скидки уточните у Алёны', verify: true }
  };

  var diagnostics = {
    id: 'diagnostics',
    title: 'Диагностика всего тела',
    price: 2500,
    includes: [
      'Тесты на двигательную активность мышц',
      'Поиск мест нарушений',
      'Понимание причин проблемных зон и способов их коррекции'
    ],
    quote: 'С этого начинаются индивидуальные тренировки.'
  };

  var personal = {
    id: 'personal',
    title: 'Запись персональных зарядок',
    count: 4,
    price: 19000,
    basis: 'по результатам диагностики',
    access: 'остаются в доступе навсегда',
    quote: 'Под ваш запрос, которые будут у вас всегда под рукой.'
  };

  var kit = {
    id: 'kit',
    title: 'Фитнес-аптечка',
    kind: 'занятия в записи',
    workouts: 4,
    minutes: 30,
    programs: [
      { id: 'relax', title: 'Расслабляющая растяжка на всё тело' },
      { id: 'neck', title: 'Свободная шея и лёгкие плечи' },
      { id: 'lower', title: 'Свободная поясница. Растяжка и сила ног. Ягодицы.' },
      { id: 'posture', title: 'Осанка и подтянутый живот' }
    ],
    tiers: [
      { n: 1, price: 2500, access: '4 недели' },
      { n: 2, price: 4000, access: '8 недель' },
      { n: 3, price: 6000, access: '3 месяца' },
      { n: 4, price: 7900, access: '4 месяца' }
    ],
    notes: ['Занимайся, когда и сколько хочешь.', 'Доступ всегда можно продлить.', 'Можно подарить: напишите Алёне.']
  };

  // Программы без цены в данных: цену и состав не выводим как факт.
  var otherPrograms = [
    {
      id: 'body',
      title: 'Красивое и здоровое тело',
      facts: ['3D-тренинг', '«Банк» из 16 тренировок по 35 минут', 'От простого к сложному', '«Никакой подготовки, только желание и немного свободного пространства»'],
      price: null,
      priceText: 'Цена по запросу'
    },
    {
      id: 'stretch_bank',
      title: 'Банк зарядок по растяжке',
      facts: ['Онлайн-программа, чтобы научиться правильно тянуться'],
      price: null,
      priceText: 'Подробности у Алёны'
    }
  ];

  /* Её запросы (пост ноября 2026). programs — программы «аптечки» по теме;
     пустой список — готовой программы по теме нет, начинаем с диагностики.
     Последний пункт — наша формулировка (docs/DECISIONS.md). */
  var requests = [
    { id: 'back', label: 'Болит спина или шея', programs: ['neck', 'lower'], careful: true },
    { id: 'injury', label: 'Была травма', programs: [], careful: true },
    { id: 'nerve', label: 'Защемляет нерв', programs: [], careful: true },
    { id: 'joints', label: 'Боль в суставах или мышцах', programs: [], careful: true },
    { id: 'sitting', label: 'Сидячая работа', programs: ['neck', 'posture'] },
    { id: 'gym', label: 'Растяжка после спортзала', programs: ['relax', 'lower'] },
    { id: 'posture', label: 'Исправить осанку', programs: ['posture'] },
    { id: 'stretch', label: 'Научиться правильно тянуться', programs: ['relax'], extra: 'stretch_bank' },
    { id: 'move', label: 'Просто подвигаться без боли', programs: ['relax'], ours: true }
  ];

  var formats = [
    { id: 'in_person', label: 'Лично в Вологде', short: 'лично' },
    { id: 'online', label: 'Онлайн вживую', hint: 'вы дома, Алёна направляет по видео', short: 'онлайн вживую' },
    { id: 'home', label: 'Выезд на дом', short: 'выезд на дом' },
    { id: 'recorded', label: 'В записи, когда удобно', short: 'в записи' }
  ];

  // Шаг 3 зависит от формата: живые форматы и запись устроены по-разному.
  var goals = {
    live: [
      { id: 'diag', label: 'Сначала разобраться', hint: 'диагностика' },
      { id: 'single', label: 'Попробовать одну тренировку' },
      { id: 'course', label: 'Курс', hint: '4 или 8 занятий' }
    ],
    recorded: [
      { id: 'kit', label: 'Готовая программа', hint: '«Фитнес-аптечка»' },
      { id: 'personal', label: 'Зарядки под мой запрос', hint: 'персонально' }
    ]
  };

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function program(id) { return byId(kit.programs, id); }
  function tier(n) {
    for (var i = 0; i < kit.tiers.length; i++) if (kit.tiers[i].n === n) return kit.tiers[i];
    return null;
  }
  function perUnit(price, n) { return Math.round(price / n); }
  function goalsFor(formatId) { return formatId === 'recorded' ? goals.recorded : goals.live; }

  /* Правила «запрос + формат + шаг 3 → услуга». Ничего сверх карточек:
     если готовой программы по теме нет — отправная точка «Диагностика всего тела». */
  function recommend(requestId, formatId, goalId) {
    var req = byId(requests, requestId);
    var fmt = byId(formats, formatId);
    if (!req || !fmt || !byId(goalsFor(formatId), goalId)) return null;

    var r = {
      service: '', title: '', lead: '', quote: '', items: [], prices: [], terms: [], notes: [],
      careful: !!req.careful, programs: [],
      prefill: { request: req.id, format: fmt.id === 'recorded' ? 'recorded' : fmt.id, service: '' }
    };

    if (fmt.id === 'recorded') {
      if (goalId === 'personal') return personalResult(r);
      if (!req.programs.length) {
        diagResult(r, fmt);
        r.lead = 'Готовой программы в записи именно под этот запрос нет. Алёна записывает персональные зарядки ' + personal.basis + '.';
        r.prices.push({ label: personal.count + ' персональных зарядки в записи', value: personal.price, note: personal.access });
        r.prefill.service = diagnostics.title;
        return r;
      }
      return kitResult(r, req);
    }

    if (goalId === 'diag') {
      diagResult(r, fmt);
      return r;
    }

    if (fmt.id === 'online') {
      r.service = online.id;
      r.title = online.title;
      r.quote = online.quote;
      r.prices.push({ label: 'Час занятия', value: online.hour });
      r.notes.push(online.discount.text + ' — ' + online.discount.note + '.');
      if (goalId === 'course') r.notes.push('Пакеты в карточках указаны для очных тренировок. Про курс онлайн спросите Алёну.');
      r.items = individual.includes.slice(1);
    } else {
      r.service = individual.id;
      r.title = individual.title + (fmt.id === 'home' ? ' с выездом на дом' : ' лично');
      r.quote = individual.quote;
      r.items = individual.includes.slice();
      var list = goalId === 'single' ? [individual.packages[0]] : individual.packages.slice(1);
      list.forEach(function (p) {
        r.prices.push({
          label: p.n === 1 ? 'Одно занятие, час' : p.n + (p.n < 5 ? ' занятия' : ' занятий'),
          value: p.price,
          note: p.n > 1 ? 'по ' + fmtRub(perUnit(p.price, p.n)) + ' за занятие' : '',
          bonus: p.bonus || ''
        });
      });
      if (fmt.id === 'home') r.notes.push(TERMS.home + ' Район и условия выезда Алёна подскажет при записи.');
    }
    r.notes.unshift('По описанию Алёны, индивидуальные тренировки начинаются с диагностики всего тела (' + fmtRub(diagnostics.price) + ').');
    r.terms.push(TERMS.prepay);
    r.prefill.service = r.title;
    return r;
  }

  function diagResult(r, fmt) {
    r.service = diagnostics.id;
    r.title = diagnostics.title;
    r.quote = diagnostics.quote;
    r.items = diagnostics.includes.slice();
    r.prices.push({ label: 'Диагностика', value: diagnostics.price });
    if (fmt.id === 'online') r.notes.push('Можно ли пройти диагностику онлайн, уточните у Алёны.');
    if (fmt.id === 'home') r.notes.push(TERMS.home + ' Условия выезда Алёна подскажет при записи.');
    r.terms.push(TERMS.prepay);
    r.prefill.service = diagnostics.title;
  }

  function personalResult(r) {
    r.service = personal.id;
    r.title = 'Персональные зарядки под ваш запрос';
    r.quote = personal.quote;
    r.lead = 'Алёна записывает ' + personal.count + ' зарядки ' + personal.basis + '. Они ' + personal.access + '.';
    r.items = ['Диагностика всего тела', personal.count + ' персональные зарядки в записи'];
    r.prices.push({ label: 'Диагностика всего тела', value: diagnostics.price });
    r.prices.push({ label: personal.count + ' персональные зарядки', value: personal.price, note: personal.access });
    r.prefill.service = r.title;
    return r;
  }

  function kitResult(r, req) {
    var progs = req.programs.map(program);
    var n = progs.length;
    var t = tier(n);
    r.service = kit.id;
    r.title = kit.title + ': ' + (n === 1 ? 'программа' : 'программы') + ' по теме';
    r.lead = 'В каждой программе ' + kit.workouts + ' комплексных тренировки по ' + kit.minutes + ' минут. ' + kit.notes[0];
    r.programs = req.programs.slice();
    r.items = progs.map(function (p) { return '«' + p.title + '»'; });
    r.prices.push({ label: n === 1 ? 'Одна программа' : n + ' программы', value: t.price, note: 'доступ ' + t.access });
    if (n > 1) r.prices.push({ label: 'Одна на выбор', value: kit.tiers[0].price, note: 'доступ ' + kit.tiers[0].access });
    if (req.extra) {
      var extra = byId(otherPrograms, req.extra);
      r.notes.push('Есть и онлайн-программа «' + extra.title + '». ' + extra.priceText + '.');
    }
    r.notes.push(kit.notes[1]);
    r.prefill.service = kit.title + ' (' + progs.map(function (p) { return p.title; }).join('; ') + ')';
    return r;
  }

  function fmtRub(v) {
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  root.OFFERS = {
    LINKS: LINKS, TERMS: TERMS,
    individual: individual, online: online, diagnostics: diagnostics, personal: personal, kit: kit,
    otherPrograms: otherPrograms, requests: requests, formats: formats, goals: goals,
    goalsFor: goalsFor, recommend: recommend, perUnit: perUnit, fmtRub: fmtRub, byId: byId,
    source: 'Цены из карточек сообщества «Движение в кайф» ВКонтакте, ноябрь 2026.'
  };
})(window);
