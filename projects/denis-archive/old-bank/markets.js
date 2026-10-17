(() => {
  const mode = document.body.dataset.market;
  const investmentData = [
    ['Атлас', 'Смешанная корзина', 104.28, 1.24, 'Умеренный', '3–5 лет', 'Широкая диверсификация в одном условном инструменте.', 'Сложнее понять вклад каждого компонента.'],
    ['Лира', 'Защитный металл', 82.46, .38, 'Умеренный', '2–4 года', 'Движение не привязано напрямую к одной компании.', 'Стоимость может долго колебаться без роста.'],
    ['Форум', 'Краткосрочный резерв', 100.12, .08, 'Низкий', 'До 1 года', 'Небольшие колебания в модели.', 'Возможный рост ограничен самой идеей инструмента.'],
    ['Аркадия', 'Инфраструктурный пул', 126.90, 1.68, 'Умеренно высокий', '4–7 лет', 'Несколько отраслей в одном тематическом наборе.', 'Зависимость от длительных проектов и расходов.'],
    ['Эллада', 'Глобальная корзина', 118.32, 1.03, 'Умеренный', '5+ лет', 'Распределение между разными вымышленными секторами.', 'Диверсификация не отменяет общего снижения.'],
    ['Оливковая роща', 'Сельское хозяйство', 73.15, -.46, 'Высокий', '3–6 лет', 'Понятная тематическая идея и материальная основа.', 'Сезонность и погодные риски в условной модели.'],
    ['Сапфир', 'Сырьевой индекс', 91.77, -.82, 'Высокий', '2–5 лет', 'Реагирует на несколько направлений экономики.', 'Сильная волатильность и цикличность.'],
    ['Орион', 'Венчурная корзина', 54.20, 2.91, 'Очень высокий', '7+ лет', 'Потенциал роста заложен в самой сюжетной модели.', 'Высокий риск потери значительной части стоимости.'],
    ['Феникс', 'Смешанный баланс', 108.63, .52, 'Умеренный', '3–5 лет', 'Сочетает защитную и более динамичную части.', 'Баланс модели может не подойти под конкретную цель.'],
    ['Дельта', 'Климатические проекты', 112.08, 1.86, 'Высокий', '5+ лет', 'Тематический фокус на долгих инфраструктурных изменениях.', 'Результат зависит от реализации проектов и допущений.'],
    ['Мрамор', 'Фонд недвижимости', 97.54, -.21, 'Умеренный', '4–6 лет', 'Несколько типов вымышленных объектов в подборке.', 'Низкая ликвидность и чувствительность к ставкам.'],
    ['Астер', 'Технологическая корзина', 141.65, 2.24, 'Высокий', '5+ лет', 'Динамичная тема с несколькими направлениями роста.', 'Высокая оценка и быстро меняющийся рынок в модели.'],
  ];
  const stockData = [
    ['Гелиос', 'Энергетика · HLS', 248.60, .84, 'Энергетические решения нового поколения.', 'Высокие расходы на расширение и нестабильный спрос.'],
    ['Агора', 'Технологии · AGR', 186.20, 1.42, 'Несколько цифровых продуктов в портфеле компании.', 'Быстрая смена технологий может обесценить разработки.'],
    ['Керамион', 'Материалы · KRM', 92.75, -.38, 'Условный спрос от строительных проектов.', 'Зависимость от сырья и цикличности строительства.'],
    ['Нерея', 'Водные системы · NRY', 314.10, 2.08, 'Специализация на очистке и повторном использовании воды.', 'Крупные проекты требуют времени и капитала.'],
    ['Прометей', 'Робототехника · PMT', 427.80, 3.16, 'Разработка автоматизированных производственных линий.', 'Технологический риск и высокая условная оценка.'],
    ['Эврика', 'Образование · EVR', 138.45, .62, 'Повторяющиеся цифровые сервисы обучения.', 'Конкуренция и сложность удержания аудитории.'],
    ['Пегас', 'Логистика · PGS', 204.90, -.74, 'Сеть поставок для нескольких вымышленных отраслей.', 'Топливо и перебои влияют на себестоимость.'],
    ['Каллисто', 'Медицина · KLS', 356.35, 1.92, 'Разработки в диагностике и лабораторных системах.', 'Высокие затраты на исследования; исходы неопределённы.'],
    ['Фарос', 'Связь · FRS', 121.08, -.16, 'Инфраструктура для передачи данных.', 'Масштабирование сети требует больших вложений.'],
    ['Талия', 'Развлечения · TLY', 167.52, 1.13, 'Несколько форматов контента и подписок.', 'Популярность контента быстро меняется.'],
    ['Эол', 'Авиатехнологии · EOL', 289.40, -1.08, 'Эффективность воздушных перевозок как ключевая тема.', 'Чувствительность к спросу, обслуживанию и топливу.'],
    ['Кронос', 'Промышленность · KRN', 232.17, .48, 'Автоматизация предприятий и сервисное обслуживание.', 'Цикличные заказы и дорогие обновления оборудования.'],
  ];

  const isStocks = mode === 'stocks';
  const dataset = isStocks ? stockData : investmentData;
  const grid = document.querySelector('#instrumentGrid');
  if (!grid) return;
  const valueOut = document.querySelector('#selectedValue');
  const nameOut = document.querySelector('#selectedName');
  const changeOut = document.querySelector('#selectedChange');
  const caption = document.querySelector('#chartCaption');
  const line = document.querySelector('#chartLine');
  const area = document.querySelector('#chartArea');
  const dot = document.querySelector('#chartDot');
  const periods = { '1m': 12, '6m': 26, '1y': 42 };
  const periodLabels = { '1m': '1 месяц', '6m': '6 месяцев', '1y': '1 год' };
  const tickSteps = [0, .11, -.05, .08, -.09, .04];
  let selectedIndex = 0;
  let selectedPeriod = '6m';
  let tick = 0;

  const fmt = (value, digits = 2) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const safe = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  dataset.forEach((item, index) => {
    const [name, type, price, change] = item;
    const risk = isStocks ? 'Вымышленная компания' : item[4];
    const horizon = isStocks ? '' : item[5];
    const plus = isStocks ? item[4] : item[6];
    const minus = isStocks ? item[5] : item[7];
    const card = document.createElement('article');
    card.className = 'instrument-card';
    card.innerHTML = `<div class="instrument-card__top"><span>${String(index + 1).padStart(2, '0')} / ${isStocks ? safe(type.split('·').pop().trim()) : 'Ι'}</span><span class="instrument-risk">${isStocks ? 'АКЦИЯ / DEMO' : `РИСК · ${safe(risk)}`}</span></div><h3>${safe(name)}</h3><div class="instrument-card__quote"><strong>${fmt(price)} ${isStocks ? '₽' : 'ед.'}</strong><span class="${change < 0 ? 'is-down' : 'is-up'}">${change > 0 ? '+' : ''}${fmt(change)}%</span></div><p class="instrument-card__thesis">${safe(type)}${horizon ? ` · ${safe(horizon)}` : ''}</p><div class="instrument-card__pros-cons"><p><b>Плюс</b><span>${safe(plus)}</span></p><p><b>Риск</b><span>${safe(minus)}</span></p></div><button class="instrument-select" type="button" aria-pressed="false" data-index="${index}">Показать динамику <span aria-hidden="true">↗</span></button>`;
    grid.append(card);
  });

  function renderChart() {
    const [name, type, base, startChange] = dataset[selectedIndex];
    const count = periods[selectedPeriod];
    const phase = (selectedIndex + 1) * .73;
    const trend = startChange / 100 * (selectedPeriod === '1m' ? .5 : selectedPeriod === '1y' ? 1.3 : 1);
    const values = Array.from({ length: count }, (_, i) => {
      const progress = i / (count - 1);
      return base * (1 + trend * (progress - .45) + Math.sin(i * .83 + phase) * .021 + Math.cos(i * .31 + phase) * .014 + Math.sin(i * .17 + phase * 1.8) * .009);
    });
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const coords = values.map((value, i) => ({ x: i / (count - 1) * 760, y: 194 - (value - min) / span * 152 }));
    const path = coords.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const last = coords.at(-1);
    line.setAttribute('d', path);
    area.setAttribute('d', `${path} L760 210 L0 210 Z`);
    dot.setAttribute('cx', last.x);
    dot.setAttribute('cy', last.y);
    caption.textContent = `${name} · ${periodLabels[selectedPeriod]}`;
    nameOut.textContent = `${name} · ${isStocks ? 'условная акция' : 'условный индекс'}`;
    updateQuote();
  }

  function updateQuote() {
    const [name, , base, startChange] = dataset[selectedIndex];
    const drift = tickSteps[tick % tickSteps.length];
    const current = base * (1 + drift / 100);
    const movement = startChange + drift;
    valueOut.textContent = `${fmt(current)} ${isStocks ? '₽' : 'ед.'}`;
    changeOut.textContent = `${movement >= 0 ? '+' : ''}${fmt(movement)}%`;
    changeOut.classList.toggle('is-down', movement < 0);
    changeOut.classList.toggle('is-up', movement >= 0);
    nameOut.textContent = `${name} · ${isStocks ? 'условная акция' : 'условный индекс'}`;
  }

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('.instrument-select');
    if (!button) return;
    selectedIndex = Number(button.dataset.index);
    grid.querySelectorAll('.instrument-select').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    grid.querySelectorAll('.instrument-card').forEach((item) => item.classList.toggle('is-selected', item.contains(button)));
    renderChart();
    document.querySelector('.market-board').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.querySelectorAll('[data-period]').forEach((button) => button.addEventListener('click', () => {
    selectedPeriod = button.dataset.period;
    document.querySelectorAll('[data-period]').forEach((item) => item.classList.toggle('is-active', item === button));
    renderChart();
  }));

  renderChart();
  window.setInterval(() => { tick += 1; updateQuote(); }, 4200);
})();
