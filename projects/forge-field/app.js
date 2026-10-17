const products = [
  { id: 'vacuum', category: 'cleaning', categoryLabel: 'Уборка', name: 'Строительный пылесос', description: 'Пылесос с баком, шлангом и насадкой для уборки помещения.', image: './assets/products/vacuum.jpg', alt: 'Пылесос с баком и длинным шлангом на полу во время уборки.', credit: 'La Miko', source: 'https://www.pexels.com/photo/cleaning-supplies-3616735/', detail: 'Фото показывает строительный пылесос в работе. Это референс типа оборудования, не изображение конкретной позиции Forge & Field.' },
  { id: 'washer', category: 'cleaning', categoryLabel: 'Уборка', name: 'Мойка высокого давления', description: 'Колёсная мойка и шланг для очистки автомобиля и оборудования.', image: './assets/products/washer.jpg', alt: 'Колёсная мойка высокого давления рядом с автомобилем.', credit: 'Erik Mclean', source: 'https://www.pexels.com/photo/pressure-washer-placed-on-sidewalk-4876669/', detail: 'На фото — мойка высокого давления в использовании. Изображение приведено как пример категории и не связано с конкретным товаром.' },
  { id: 'compressor-workshop', category: 'air', categoryLabel: 'Компрессоры', name: 'Воздушный компрессор', description: 'Компрессор с ресивером, двигателем и манометром в мастерской.', image: './assets/products/compressor-workshop.jpg', alt: 'Большой воздушный компрессор в мастерской.', credit: 'Jonathan Cooper', source: 'https://www.pexels.com/photo/an-air-compressor-9754814/', detail: 'Фотография компрессора в мастерской. Реальные характеристики оборудования на снимке не указаны в этом демо.' },
  { id: 'compressor-vintage', category: 'air', categoryLabel: 'Компрессоры', name: 'Компрессор с ресивером', description: 'Горизонтальный ресивер с ремённым приводом в старой мастерской.', image: './assets/products/compressor-vintage.jpg', alt: 'Старый горизонтальный компрессор с ресивером в рабочем помещении.', credit: 'Eky Rima Nurya Ganda', source: 'https://www.pexels.com/photo/vintage-air-compressor-with-oil-can-in-workshop-31095182/', detail: 'Предметный фотопример компрессора с ресивером. Фото и видимый на нём бренд принадлежат автору снимка.' },
  { id: 'power-field', category: 'power', categoryLabel: 'Питание', name: 'Питание для выездной команды', description: 'Портативная электростанция рядом с полевым фотооборудованием.', image: './assets/products/power-field-kit.jpg', alt: 'Портативная электростанция и оборудование для съёмки на выезде.', credit: 'Amar Preciado', source: 'https://www.pexels.com/photo/portable-power-station-with-drone-accessories-37489594/', detail: 'Снимок показывает портативную электростанцию в комплекте с полевым оборудованием. Он служит визуальным примером сценария автономного питания.' },
  { id: 'power-portable', category: 'power', categoryLabel: 'Питание', name: 'Портативная электростанция', description: 'Переносной источник питания в полевых условиях.', image: './assets/products/power-portable.jpg', alt: 'Человек переносит портативную электростанцию на природе.', credit: 'Amar Preciado', source: 'https://www.pexels.com/photo/person-holding-portable-power-station-in-nature-37489595/', detail: 'Фотография показывает переносной источник питания в полевых условиях. Модель и её характеристики здесь не заявляются.' },
  { id: 'toolkit-wrenches', category: 'hand', categoryLabel: 'Инструмент', name: 'Набор ключей в кейсе', description: 'Набор гаечных ключей, головок и ручного инструмента.', image: './assets/products/toolkit-detail.jpg', alt: 'Открытый кейс с гаечными ключами, головками и ручным инструментом.', credit: 'Artem Podrez', source: 'https://www.pexels.com/photo/tools-and-wrenches-in-a-portable-case-8985918/', detail: 'На фото показан открытый инструментальный кейс. Состав и количество предметов в нём не переносим на какую-либо демо-позицию.' },
  { id: 'toolkit-screwdrivers', category: 'hand', categoryLabel: 'Инструмент', name: 'Набор отвёрток', description: 'Компактный комплект отвёрток в пластиковом футляре.', image: './assets/products/toolkit-screwdrivers.jpg', alt: 'Открытый серый футляр с отвёртками с синими рукоятками.', credit: 'Carlos Zael', source: 'https://www.pexels.com/photo/hand-tools-in-gray-toolbox-11882650/', detail: 'Фотография набора отвёрток в футляре. Точные характеристики и бренд предмета относятся к оригинальному снимку.' }
];

const state = { category: 'all', search: '' };
const grid = document.querySelector('#product-grid');
const emptyState = document.querySelector('#empty-state');
const resultCount = document.querySelector('#result-count');
const productDialog = document.querySelector('#product-dialog');
const requestDialog = document.querySelector('#request-dialog');
let requestReturnFocus = null;

function photoCredit(product) {
  return `<a href="${product.source}" target="_blank" rel="noreferrer">Фото: ${product.credit} / Pexels</a>`;
}

function productCard(product) {
  return `<article class="product-card" data-item="${product.id}">
    <figure class="card-photo"><img src="${product.image}" alt="${product.alt}" loading="lazy" /><figcaption>${photoCredit(product)}</figcaption></figure>
    <div class="card-body"><p class="card-category">${product.categoryLabel} <span>·</span> фото-пример</p><h3>${product.name}</h3><p class="card-description">${product.description}</p><button class="card-action" type="button" data-product-id="${product.id}">О фотографии <span aria-hidden="true">↗</span></button></div>
  </article>`;
}

function filteredProducts() {
  return products.filter((product) => {
    const matchesCategory = state.category === 'all' || product.category === state.category;
    const haystack = `${product.name} ${product.description} ${product.categoryLabel} ${product.credit}`.toLowerCase();
    return matchesCategory && (!state.search || haystack.includes(state.search.toLowerCase()));
  });
}

function renderProducts() {
  const visible = filteredProducts();
  grid.innerHTML = visible.map(productCard).join('');
  resultCount.textContent = String(visible.length).padStart(2, '0');
  emptyState.hidden = visible.length !== 0;
}

function setupHeroGallery() {
  const image = document.querySelector('[data-hero-image]');
  const caption = document.querySelector('[data-hero-caption]');
  const count = document.querySelector('[data-hero-count]');
  const controls = [...document.querySelectorAll('[data-hero-step]')];
  if (!image || !caption || !count || !products.length) return;
  let index = Math.max(0, products.findIndex((product) => product.id === 'compressor-workshop'));
  const show = () => {
    const product = products[index];
    image.src = product.image;
    image.alt = product.alt;
    count.value = `${String(index + 1).padStart(2, '0')} / ${String(products.length).padStart(2, '0')}`;
    const link = document.createElement('a');
    link.href = product.source;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = `${product.credit} / Pexels`;
    caption.replaceChildren(document.createTextNode(`${product.name} · фото `), link);
  };
  controls.forEach((button) => button.addEventListener('click', () => {
    index = (index + Number(button.dataset.heroStep) + products.length) % products.length;
    show();
  }));
  show();
}

function syncCategory(category) {
  state.category = category;
  document.querySelectorAll('[data-category]').forEach((button) => {
    const active = button.dataset.category === category;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderProducts();
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
  if (!productDialog.open && !requestDialog.open) document.body.classList.remove('modal-open');
}

function openProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  document.querySelector('#product-dialog-content').innerHTML = `<div class="product-detail"><figure class="detail-photo"><img src="${product.image}" alt="${product.alt}" /><figcaption>${photoCredit(product)}</figcaption></figure><div class="detail-info"><p class="eyebrow">${product.categoryLabel} · фото-пример</p><h2 id="product-dialog-title">${product.name}</h2><p>${product.detail}</p><button class="button button-copper button-wide" type="button" data-open-request data-product="${product.name}" data-source-product="${product.id}">Добавить в демо-запрос</button></div></div>`;
  openDialog(productDialog);
}

function resetFilters() {
  state.category = 'all';
  state.search = '';
  document.querySelector('#search-input').value = '';
  syncCategory('all');
}

document.addEventListener('click', (event) => {
  const category = event.target.closest('[data-category]');
  if (category) syncCategory(category.dataset.category);
  const card = event.target.closest('[data-product-id]');
  if (card) openProduct(card.dataset.productId);
  const close = event.target.closest('[data-close-dialog]');
  if (close) closeDialog(close.closest('dialog'));
  const openRequest = event.target.closest('[data-open-request]');
  if (openRequest) {
    const product = openRequest.dataset.product;
    requestReturnFocus = productDialog.open
      ? grid.querySelector(`[data-product-id="${openRequest.dataset.sourceProduct}"]`)
      : openRequest;
    const message = requestDialog.querySelector('[name="message"]');
    if (product && !message.value) message.value = `Интересует категория или фото-пример: ${product}.`;
    closeDialog(productDialog);
    openDialog(requestDialog);
  }
  if (event.target.id === 'empty-reset') resetFilters();
});

document.querySelector('#search-input').addEventListener('input', (event) => {
  state.search = event.target.value.trim();
  renderProducts();
});

document.querySelector('#request-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.querySelector('#form-status');
  status.textContent = 'Демо-запрос заполнен в интерфейсе. Данные никуда не отправлены.';
  status.hidden = false;
  event.target.querySelector('button[type="submit"]').disabled = true;
});

document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog(dialog);
}));

requestDialog.addEventListener('close', () => {
  const target = requestReturnFocus;
  requestReturnFocus = null;
  if (target?.isConnected) target.focus();
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('#search-input').focus();
  }
  if (event.key === 'Escape') {
    closeDialog(productDialog);
    closeDialog(requestDialog);
  }
});

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');

menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  menuToggle.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
  mobileMenu.hidden = open;
});

mobileMenu.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  mobileMenu.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
});

renderProducts();
setupHeroGallery();
